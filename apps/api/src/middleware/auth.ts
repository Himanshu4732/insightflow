import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let token = req.cookies?.access_token;

    // Fallback: check Authorization header
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'supersecretchangeinproduction';
    const decoded = jwt.verify(token, jwtSecret) as { id: string; email: string };

    // Fetch user from DB to ensure they still exist
    const userRes = await query('SELECT id, email, name, avatar_url FROM users WHERE id = $1', [decoded.id]);
    
    if (userRes.rowCount === 0) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    const user = userRes.rows[0];
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
    };

    next();
  } catch (err: any) {
    console.error('Authentication middleware error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}
