import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { query, pool } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretchangeinproduction';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'anotherrefreshsupersecrettoken';
const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || '';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Token generators
function generateAccessToken(user: { id: string; email: string }) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(user: { id: string; email: string }) {
  return jwt.sign({ id: user.id, email: user.email }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

// Set httpOnly cookies
function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// 1. POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const clientDb = await pool.connect();
  try {
    await clientDb.query('BEGIN');

    // Check if user exists
    const checkUser = await clientDb.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      await clientDb.query('ROLLBACK');
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const userRes = await clientDb.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, avatar_url',
      [email, passwordHash, name]
    );
    const newUser = userRes.rows[0];

    // Create default organization
    const orgName = `${name}'s Workspace`;
    const orgSlug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-org-${Math.random().toString(36).substring(2, 7)}`;
    const orgRes = await clientDb.query(
      "INSERT INTO organisations (name, slug, plan) VALUES ($1, $2, 'free') RETURNING id, name, slug",
      [orgName, orgSlug]
    );
    const newOrg = orgRes.rows[0];

    // Associate user with organization as admin
    await clientDb.query(
      'INSERT INTO org_members (org_id, user_id, role) VALUES ($1, $2, $3)',
      [newOrg.id, newUser.id, 'admin']
    );

    await clientDb.query('COMMIT');

    // Generate tokens
    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);
    setAuthCookies(res, accessToken, refreshToken);

    return res.status(201).json({
      user: newUser,
      organisation: newOrg,
    });
  } catch (err: any) {
    await clientDb.query('ROLLBACK');
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  } finally {
    clientDb.release();
  }
});

// 2. POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const userRes = await query('SELECT id, email, password_hash, name, avatar_url FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = userRes.rows[0];
    
    if (!user.password_hash) {
      return res.status(400).json({ error: 'Account created using Google. Please log in with Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setAuthCookies(res, accessToken, refreshToken);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// 3. GET /api/auth/me
router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  return res.json({ user: req.user });
});

// 4. POST /api/auth/google
router.post('/google', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'Google ID Token is required.' });
  }

  let email: string;
  let name: string;
  let picture: string | undefined;
  let googleId: string;

  try {
    // Attempt Google Verification
    if (GOOGLE_CLIENT_ID) {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email || !payload.name || !payload.sub) {
        return res.status(400).json({ error: 'Invalid Google payload.' });
      }
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
      googleId = payload.sub;
    } else {
      // Mock validation for local testing/development when no VITE_GOOGLE_CLIENT_ID is provided
      console.warn('VITE_GOOGLE_CLIENT_ID is not configured. Running mock Google Auth validation.');
      const decodedMock = jwt.decode(idToken) as any;
      if (decodedMock && decodedMock.email && decodedMock.name) {
        email = decodedMock.email;
        name = decodedMock.name;
        picture = decodedMock.picture;
        googleId = decodedMock.sub || decodedMock.googleId || 'mock-google-id';
      } else {
        // Fallback fallback if payload isn't a mock jwt
        email = 'google-user@example.com';
        name = 'Google User';
        picture = '';
        googleId = 'mock-google-id';
      }
    }
  } catch (err: any) {
    console.error('Google token verification failed:', err);
    return res.status(400).json({ error: 'Invalid Google login credentials.' });
  }

  const clientDb = await pool.connect();
  try {
    await clientDb.query('BEGIN');

    // Upsert User
    const userRes = await clientDb.query(
      `INSERT INTO users (email, name, avatar_url, google_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) 
       DO UPDATE SET google_id = EXCLUDED.google_id, avatar_url = COALESCE(users.avatar_url, EXCLUDED.avatar_url), name = COALESCE(users.name, EXCLUDED.name)
       RETURNING id, email, name, avatar_url`,
      [email, name, picture, googleId]
    );
    const dbUser = userRes.rows[0];

    // Check if user has an organisation membership
    const checkMember = await clientDb.query('SELECT id FROM org_members WHERE user_id = $1', [dbUser.id]);
    
    if (checkMember.rows.length === 0) {
      // Create organization
      const orgName = `${name}'s Workspace`;
      const orgSlug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-org-${Math.random().toString(36).substring(2, 7)}`;
      const orgRes = await clientDb.query(
        "INSERT INTO organisations (name, slug, plan) VALUES ($1, $2, 'free') RETURNING id, name, slug",
        [orgName, orgSlug]
      );
      const newOrg = orgRes.rows[0];

      // Associate user with organization as admin
      await clientDb.query(
        'INSERT INTO org_members (org_id, user_id, role) VALUES ($1, $2, $3)',
        [newOrg.id, dbUser.id, 'admin']
      );
    }

    await clientDb.query('COMMIT');

    // Generate tokens
    const accessToken = generateAccessToken(dbUser);
    const refreshToken = generateRefreshToken(dbUser);
    setAuthCookies(res, accessToken, refreshToken);

    return res.json({ user: dbUser });
  } catch (err: any) {
    await clientDb.query('ROLLBACK');
    console.error('Google authentication DB upsert error:', err);
    return res.status(500).json({ error: 'Google login server error.' });
  } finally {
    clientDb.release();
  }
});

// 5. POST /api/auth/logout
router.post('/logout', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// 6. PUT /api/auth/profile - Update profile info (name, avatar)
router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const { name, avatar_url } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required.' });
  }

  try {
    const userRes = await query(
      'UPDATE users SET name = $1, avatar_url = COALESCE($2, avatar_url), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, email, name, avatar_url',
      [name, avatar_url || null, userId]
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ user: userRes.rows[0] });
  } catch (err) {
    console.error('Failed to update profile:', err);
    return res.status(500).json({ error: 'Failed to update profile details.' });
  }
});

// 7. PUT /api/auth/password - Change password
router.put('/password', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  try {
    const userRes = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (userRes.rowCount === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userRes.rows[0];
    if (!user.password_hash) {
      return res.status(400).json({ error: 'OAuth accounts do not have a password. Please sign in with Google.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newHash, userId]);

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Failed to change password:', err);
    return res.status(500).json({ error: 'Failed to change password.' });
  }
});

export default router;
