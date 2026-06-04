import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { query, pool } from '../db';

const router = Router();

// POST /api/workspace/create
router.post('/create', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { name, slug } = req.body;
  const userId = req.user?.id;

  if (!name || !slug) {
    return res.status(400).json({ error: 'Workspace name and slug are required.' });
  }

  const clientDb = await pool.connect();
  try {
    await clientDb.query('BEGIN');

    // Check if slug exists
    const checkSlug = await clientDb.query('SELECT id FROM organisations WHERE slug = $1', [slug]);
    if (checkSlug.rows.length > 0) {
      await clientDb.query('ROLLBACK');
      return res.status(400).json({ error: 'Workspace URL slug is already taken.' });
    }

    // Insert new organization
    const orgRes = await clientDb.query(
      "INSERT INTO organisations (name, slug, plan) VALUES ($1, $2, 'free') RETURNING id, name, slug, plan, created_at",
      [name, slug]
    );
    const newOrg = orgRes.rows[0];

    // Associate user with organization as admin
    await clientDb.query(
      'INSERT INTO org_members (org_id, user_id, role) VALUES ($1, $2, $3)',
      [newOrg.id, userId, 'admin']
    );

    await clientDb.query('COMMIT');
    return res.status(201).json({ organisation: newOrg });
  } catch (err: any) {
    await clientDb.query('ROLLBACK');
    console.error('Workspace creation error:', err);
    return res.status(500).json({ error: 'Failed to create workspace.' });
  } finally {
    clientDb.release();
  }
});

// GET /api/workspace - Retrieve the current workspace organization details
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  try {
    const orgRes = await query(
      `SELECT o.id, o.name, o.slug, o.plan, o.created_at, om.role
       FROM organisations o 
       JOIN org_members om ON o.id = om.org_id 
       WHERE om.user_id = $1 LIMIT 1`,
      [userId]
    );
    if (orgRes.rows.length === 0) {
      return res.status(404).json({ error: 'No active workspace found for this user.' });
    }
    return res.json({ workspace: orgRes.rows[0] });
  } catch (err) {
    console.error('Failed to get workspace:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/workspace - Update workspace settings (name and slug)
router.put('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const { name, slug } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ error: 'Workspace name and slug are required.' });
  }

  try {
    const orgRes = await query(
      `SELECT o.id, om.role FROM organisations o 
       JOIN org_members om ON o.id = om.org_id 
       WHERE om.user_id = $1 LIMIT 1`,
      [userId]
    );
    
    if (orgRes.rows.length === 0) {
      return res.status(404).json({ error: 'Workspace not found.' });
    }

    const { id: orgId, role } = orgRes.rows[0];
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update workspace settings.' });
    }

    // Check slug collision
    const slugCheck = await query('SELECT id FROM organisations WHERE slug = $1 AND id <> $2', [slug, orgId]);
    if (slugCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Workspace slug is already in use.' });
    }

    const updateRes = await query(
      'UPDATE organisations SET name = $1, slug = $2 WHERE id = $3 RETURNING id, name, slug, plan, created_at',
      [name, slug, orgId]
    );

    return res.json({ workspace: updateRes.rows[0] });
  } catch (err) {
    console.error('Failed to update workspace:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/workspace - Delete the active workspace organization
router.delete('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  try {
    const orgRes = await query(
      `SELECT o.id, om.role FROM organisations o 
       JOIN org_members om ON o.id = om.org_id 
       WHERE om.user_id = $1 LIMIT 1`,
      [userId]
    );

    if (orgRes.rows.length === 0) {
      return res.status(404).json({ error: 'Workspace not found.' });
    }

    const { id: orgId, role } = orgRes.rows[0];
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete the workspace.' });
    }

    await query('DELETE FROM organisations WHERE id = $1', [orgId]);
    return res.json({ success: true, message: 'Workspace deleted successfully.' });
  } catch (err) {
    console.error('Failed to delete workspace:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
