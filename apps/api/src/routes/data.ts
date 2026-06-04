import { Router } from 'express';
import { requireAuth } from '../middleware/auth';

const router = Router();

// POST /api/data/upload
router.post('/upload', requireAuth, (req, res) => {
  const { filename, rowCount, columns } = req.body;

  // Generate dataset ID
  const datasetId = `ds-${Math.random().toString(36).substring(2, 7)}`;

  // Default mock schema if columns are not provided
  const parsedSchema = columns && columns.length > 0 
    ? columns.map((col: string) => {
        let type = 'text';
        const lowerCol = col.toLowerCase();
        if (lowerCol.includes('date') || lowerCol.includes('time') || lowerCol.includes('year')) {
          type = 'date';
        } else if (
          lowerCol.includes('revenue') || 
          lowerCol.includes('amount') || 
          lowerCol.includes('score') || 
          lowerCol.includes('count') || 
          lowerCol.includes('value') ||
          lowerCol.includes('users') ||
          lowerCol.includes('id')
        ) {
          type = 'number';
        }
        return { name: col, type };
      })
    : [
        { name: 'Date', type: 'date' },
        { name: 'Revenue', type: 'number' },
        { name: 'Active Users', type: 'number' },
        { name: 'Status', type: 'text' }
      ];

  return res.json({
    dataset_id: datasetId,
    filename: filename || 'metrics_data.csv',
    rowCount: rowCount || 1250,
    schema: parsedSchema,
  });
});

export default router;
