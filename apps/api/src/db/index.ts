import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/insightflow';

export const pool = new Pool({
  connectionString,
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};
