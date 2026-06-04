import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { query } from '../db';

const router = Router();

// GET /api/org/members - Retrieve active members and pending invites
router.get('/members', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;

  try {
    // 1. Get org_id for the user
    const orgRes = await query('SELECT org_id FROM org_members WHERE user_id = $1 LIMIT 1', [userId]);
    if (orgRes.rows.length === 0) {
      return res.json({ members: [], invites: [] });
    }
    const orgId = orgRes.rows[0].org_id;

    // 2. Fetch active members
    const membersRes = await query(
      `SELECT om.id as id, u.id as user_id, u.name, u.email, u.avatar_url, om.role 
       FROM org_members om 
       JOIN users u ON om.user_id = u.id 
       WHERE om.org_id = $1 
       ORDER BY u.name ASC`,
      [orgId]
    );

    // 3. Fetch pending invites
    const invitesRes = await query(
      `SELECT id, email, role, created_at 
       FROM invites 
       WHERE org_id = $1 
       ORDER BY created_at DESC`,
      [orgId]
    );

    return res.json({
      members: membersRes.rows,
      invites: invitesRes.rows
    });
  } catch (err) {
    console.error('Failed to get org members:', err);
    return res.status(500).json({ error: 'Failed to retrieve organization members.' });
  }
});

// POST /api/org/members - Invite a new member by email (adds directly if user exists, else adds to pending invites)
router.post('/members', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ error: 'Email and role are required.' });
  }

  const validRoles = ['admin', 'analyst', 'viewer'];
  if (!validRoles.includes(role.toLowerCase())) {
    return res.status(400).json({ error: 'Invalid role. Must be admin, analyst, or viewer.' });
  }

  try {
    // Get current user's org
    const orgRes = await query('SELECT org_id FROM org_members WHERE user_id = $1 LIMIT 1', [userId]);
    if (orgRes.rows.length === 0) {
      return res.status(400).json({ error: 'User does not belong to any workspace.' });
    }
    const orgId = orgRes.rows[0].org_id;

    // Check if user already exists
    const userCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      const invitedUserId = userCheck.rows[0].id;

      // Check if already in org_members
      const memberCheck = await query(
        'SELECT id FROM org_members WHERE org_id = $1 AND user_id = $2',
        [orgId, invitedUserId]
      );
      if (memberCheck.rows.length > 0) {
        return res.status(400).json({ error: 'User is already a member of this workspace.' });
      }

      // Add to org_members
      await query(
        'INSERT INTO org_members (org_id, user_id, role) VALUES ($1, $2, $3)',
        [orgId, invitedUserId, role.toLowerCase()]
      );
      return res.status(201).json({ message: 'User added to workspace successfully.' });
    } else {
      // Invite table check
      const inviteCheck = await query(
        'SELECT id FROM invites WHERE org_id = $1 AND email = $2',
        [orgId, email]
      );
      if (inviteCheck.rows.length > 0) {
        return res.status(400).json({ error: 'An invitation is already pending for this email.' });
      }

      // Add to invites
      await query(
        'INSERT INTO invites (org_id, email, role) VALUES ($1, $2, $3)',
        [orgId, email, role.toLowerCase()]
      );
      return res.status(201).json({ message: 'Invitation sent successfully.' });
    }
  } catch (err) {
    console.error('Failed to add org member:', err);
    return res.status(500).json({ error: 'Failed to process member invitation.' });
  }
});

// DELETE /api/org/members/:id - Remove a member or delete/revoke a pending invite
router.delete('/members/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const idToDelete = req.params.id;

  try {
    // Get org_id
    const orgRes = await query('SELECT org_id FROM org_members WHERE user_id = $1 LIMIT 1', [userId]);
    if (orgRes.rows.length === 0) {
      return res.status(400).json({ error: 'User does not belong to any workspace.' });
    }
    const orgId = orgRes.rows[0].org_id;

    // Check if it matches an org_member ID
    const memberCheck = await query(
      'SELECT id, user_id FROM org_members WHERE id = $1 AND org_id = $2',
      [idToDelete, orgId]
    );

    if (memberCheck.rows.length > 0) {
      const member = memberCheck.rows[0];
      // Prevent deleting self
      if (member.user_id === userId) {
        return res.status(400).json({ error: 'You cannot remove yourself from the workspace.' });
      }

      await query('DELETE FROM org_members WHERE id = $1', [idToDelete]);
      return res.json({ success: true, message: 'Member removed from workspace.' });
    }

    // Check if it matches a pending invite ID
    const inviteCheck = await query(
      'SELECT id FROM invites WHERE id = $1 AND org_id = $2',
      [idToDelete, orgId]
    );

    if (inviteCheck.rows.length > 0) {
      await query('DELETE FROM invites WHERE id = $1', [idToDelete]);
      return res.json({ success: true, message: 'Invitation revoked.' });
    }

    return res.status(404).json({ error: 'Member or invitation not found.' });
  } catch (err) {
    console.error('Failed to remove member/invite:', err);
    return res.status(500).json({ error: 'Failed to complete member deletion.' });
  }
});

export default router;
