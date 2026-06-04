import { Router, Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { query, pool } from '../db';
import { emitRowInsert } from '../ws';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// CSV splitting utility that handles quotes and commas correctly
const splitCsvLine = (text: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
};

// CSV parsing utility
const parseCsv = (text: string) => {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = splitCsvLine(lines[0]);
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(row);
  }
  return { headers, rows };
};

// Automatic Column Type Inference Heuristic
const inferColumnTypes = (headers: string[], rows: any[]) => {
  const sampleRows = rows.slice(0, 100);
  return headers.map(header => {
    let hasNumber = false;
    let hasDate = false;
    let hasText = false;

    for (const row of sampleRows) {
      const val = String(row[header] || '').trim();
      if (!val) continue;

      // Check if it is numeric
      if (!isNaN(Number(val)) && !isNaN(parseFloat(val))) {
        hasNumber = true;
      } else if (!isNaN(Date.parse(val)) && val.length > 5 && isNaN(Number(val))) {
        hasDate = true;
      } else {
        hasText = true;
      }
    }

    let type = 'text';
    if (hasNumber && !hasText && !hasDate) {
      type = 'number';
    } else if (hasDate && !hasText && !hasNumber) {
      type = 'date';
    }
    return { name: header, type };
  });
};

// 1. GET /api/datasets
// List active datasets of the user's organisation
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  try {
    const orgRes = await query('SELECT org_id FROM org_members WHERE user_id = $1 LIMIT 1', [userId]);
    if (orgRes.rowCount === 0) {
      return res.json([]);
    }
    const orgId = orgRes.rows[0].org_id;

    const datasetsRes = await query(
      'SELECT id, filename, row_count, schema, created_at FROM datasets WHERE org_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
      [orgId]
    );
    return res.json(datasetsRes.rows);
  } catch (err) {
    console.error('Failed to list datasets:', err);
    return res.status(500).json({ error: 'Failed to retrieve datasets list.' });
  }
});

// 2. POST /api/datasets/upload
// Accepts multipart CSV/Excel and parses it in memory before database batching
router.post('/upload', requireAuth, upload.single('file'), async (req: AuthenticatedRequest, res) => {
  const file = req.file;
  const userId = req.user?.id;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const filename = file.originalname.toLowerCase();
  let headers: string[] = [];
  let rows: any[] = [];

  try {
    if (filename.endsWith('.csv')) {
      const csvContent = file.buffer.toString('utf-8');
      const parsed = parseCsv(csvContent);
      headers = parsed.headers;
      rows = parsed.rows;
    } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rowsData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      
      if (rowsData.length === 0) {
        return res.status(400).json({ error: 'Spreadsheet is empty.' });
      }

      headers = rowsData[0].map(h => String(h || '').trim()).filter(h => h !== '');
      for (let i = 1; i < rowsData.length; i++) {
        const rowData = rowsData[i];
        if (rowData.length === 0) continue;
        const row: Record<string, string> = {};
        headers.forEach((header, idx) => {
          row[header] = rowData[idx] !== undefined ? String(rowData[idx]).trim() : '';
        });
        rows.push(row);
      }
    } else {
      return res.status(400).json({ error: 'Invalid file format. Please upload CSV or Excel spreadsheet.' });
    }

    if (headers.length === 0 || rows.length === 0) {
      return res.status(400).json({ error: 'Failed to parse empty headers or rows.' });
    }

    // Infer column schemas
    const schema = inferColumnTypes(headers, rows);

    // Retrieve organization ID
    const orgRes = await query('SELECT org_id FROM org_members WHERE user_id = $1 LIMIT 1', [userId]);
    if (orgRes.rowCount === 0) {
      return res.status(400).json({ error: 'User does not belong to any active workspace.' });
    }
    const orgId = orgRes.rows[0].org_id;

    // Database insertions inside transaction client
    const clientDb = await pool.connect();
    try {
      await clientDb.query('BEGIN');
      
      const insertDataset = await clientDb.query(
        'INSERT INTO datasets (org_id, filename, row_count, schema) VALUES ($1, $2, $3, $4) RETURNING id, filename, row_count, schema, created_at',
        [orgId, file.originalname, rows.length, JSON.stringify(schema)]
      );
      const dataset = insertDataset.rows[0];

      // Perform batch inserts of rows (chunks of 500)
      const chunkSize = 500;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const valueStrings: string[] = [];
        const values: any[] = [];

        chunk.forEach((row, idx) => {
          const rowIndex = i + idx;
          const offset = values.length;
          valueStrings.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
          values.push(dataset.id, rowIndex, JSON.stringify(row));
        });

        const insertRowsQuery = `INSERT INTO dataset_rows (dataset_id, row_index, data) VALUES ${valueStrings.join(', ')}`;
        await clientDb.query(insertRowsQuery, values);
      }

      await clientDb.query('COMMIT');

      // Live websocket updates
      if (rows.length > 0) {
        emitRowInsert(orgId, dataset.id, rows[0]);
      }

      return res.status(201).json({
        dataset_id: dataset.id,
        filename: dataset.filename,
        rowCount: dataset.row_count,
        schema: dataset.schema
      });
    } catch (dbErr) {
      await clientDb.query('ROLLBACK');
      console.error('Database write error during upload transaction:', dbErr);
      throw dbErr;
    } finally {
      clientDb.release();
    }
  } catch (err: any) {
    console.error('Failed to upload and parse dataset:', err.message);
    return res.status(500).json({ error: 'Internal processing failure during dataset ingestion.' });
  }
});

// 3. GET /api/datasets/:id
// Get metadata and schema for a single dataset
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const datasetId = req.params.id;
  const userId = req.user?.id;

  try {
    const orgRes = await query('SELECT org_id FROM org_members WHERE user_id = $1 LIMIT 1', [userId]);
    if (orgRes.rowCount === 0) {
      return res.status(404).json({ error: 'Workspace not found.' });
    }
    const orgId = orgRes.rows[0].org_id;

    const datasetRes = await query(
      'SELECT id, filename, row_count, schema, created_at FROM datasets WHERE id = $1 AND org_id = $2 AND deleted_at IS NULL',
      [datasetId, orgId]
    );

    if (datasetRes.rowCount === 0) {
      return res.status(404).json({ error: 'Dataset not found.' });
    }

    return res.json(datasetRes.rows[0]);
  } catch (err) {
    console.error('Failed to get dataset details:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 4. GET /api/datasets/:id/rows
// Dynamic search, pagination, filtering, and sorting of dataset rows
router.get('/:id/rows', requireAuth, async (req: AuthenticatedRequest, res) => {
  const datasetId = req.params.id;
  const userId = req.user?.id;

  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  const sortBy = req.query.sort as string;
  const sortOrder = (req.query.order as string || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  try {
    const orgRes = await query('SELECT org_id FROM org_members WHERE user_id = $1 LIMIT 1', [userId]);
    if (orgRes.rowCount === 0) {
      return res.status(404).json({ error: 'Workspace not found.' });
    }
    const orgId = orgRes.rows[0].org_id;

    // Fetch and check dataset access
    const datasetRes = await query(
      'SELECT schema FROM datasets WHERE id = $1 AND org_id = $2 AND deleted_at IS NULL',
      [datasetId, orgId]
    );

    if (datasetRes.rowCount === 0) {
      return res.status(404).json({ error: 'Dataset not found.' });
    }

    const schema = datasetRes.rows[0].schema as Array<{ name: string; type: string }>;
    const schemaCols = schema.map(col => col.name);
    const colTypes = new Map(schema.map(col => [col.name, col.type]));

    let queryText = 'SELECT id, row_index, data FROM dataset_rows WHERE dataset_id = $1';
    let countText = 'SELECT COUNT(*) FROM dataset_rows WHERE dataset_id = $1';
    const queryParams: any[] = [datasetId];

    // Filter processing
    if (req.query.filters) {
      try {
        const filters = JSON.parse(req.query.filters as string);
        Object.keys(filters).forEach(col => {
          const val = filters[col];
          // Ensure column matches schema parameters to prevent injection
          if (schemaCols.includes(col) && val !== undefined && val !== null && val !== '') {
            queryParams.push(`%${val}%`);
            const pIdx = queryParams.length;
            queryText += ` AND data->>'${col}' ILIKE $${pIdx}`;
            countText += ` AND data->>'${col}' ILIKE $${pIdx}`;
          }
        });
      } catch (fErr) {
        console.warn('Skipping query filters - parsing error:', fErr);
      }
    }

    // Sort processing
    if (sortBy && schemaCols.includes(sortBy)) {
      const type = colTypes.get(sortBy);
      if (type === 'number') {
        queryText += ` ORDER BY NULLIF(data->>'${sortBy}', '')::numeric ${sortOrder}`;
      } else if (type === 'date') {
        queryText += ` ORDER BY NULLIF(data->>'${sortBy}', '')::timestamp ${sortOrder}`;
      } else {
        queryText += ` ORDER BY data->>'${sortBy}' ${sortOrder}`;
      }
    } else {
      queryText += ' ORDER BY row_index ASC';
    }

    // Pagination query limits
    queryParams.push(limit);
    const limitParamIdx = queryParams.length;
    queryParams.push(offset);
    const offsetParamIdx = queryParams.length;

    queryText += ` LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`;

    // Execute queries
    const rowsRes = await query(queryText, queryParams);
    const countParams = queryParams.slice(0, queryParams.length - 2);
    const countRes = await query(countText, countParams);

    const rows = rowsRes.rows.map(r => ({
      id: r.id,
      rowIndex: r.row_index,
      ...r.data
    }));

    return res.json({
      rows,
      totalCount: parseInt(countRes.rows[0].count, 10)
    });
  } catch (err) {
    console.error('Failed to retrieve rows:', err);
    return res.status(500).json({ error: 'Failed to retrieve dataset rows.' });
  }
});

// 5. DELETE /api/datasets/:id
// Soft delete route updating deleted_at timestamp
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const datasetId = req.params.id;
  const userId = req.user?.id;

  try {
    const orgRes = await query('SELECT org_id FROM org_members WHERE user_id = $1 LIMIT 1', [userId]);
    if (orgRes.rowCount === 0) {
      return res.status(404).json({ error: 'Workspace not found.' });
    }
    const orgId = orgRes.rows[0].org_id;

    const deleteRes = await query(
      'UPDATE datasets SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND org_id = $2 AND deleted_at IS NULL RETURNING id',
      [datasetId, orgId]
    );

    if (deleteRes.rowCount === 0) {
      return res.status(404).json({ error: 'Dataset not found or already deleted.' });
    }

    return res.json({ success: true, message: 'Dataset soft-deleted successfully.' });
  } catch (err) {
    console.error('Failed to delete dataset:', err);
    return res.status(500).json({ error: 'Internal server error during deletion.' });
  }
});

export default router;
