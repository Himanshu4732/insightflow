import { query } from './index';

export async function initDb() {
  try {
    // Enable uuid generator if needed (optional since we can use gen_random_uuid() or manual uuid string generation)
    await query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        google_id VARCHAR(255) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create organisations table
    await query(`
      CREATE TABLE IF NOT EXISTS organisations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        plan VARCHAR(50) DEFAULT 'free',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create org_members table
    await query(`
      CREATE TABLE IF NOT EXISTS org_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'analyst', 'viewer')),
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (org_id, user_id)
      );
    `);

    // Create datasets table
    await query(`
      CREATE TABLE IF NOT EXISTS datasets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        row_count INTEGER NOT NULL,
        schema JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // Create dataset_rows table
    await query(`
      CREATE TABLE IF NOT EXISTS dataset_rows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
        row_index INTEGER NOT NULL,
        data JSONB NOT NULL
      );
    `);

    // Create flat orders table for direct SQL aggregations
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        order_id VARCHAR(100) NOT NULL,
        customer_id VARCHAR(100) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price NUMERIC NOT NULL,
        total_revenue NUMERIC NOT NULL,
        country VARCHAR(50) NOT NULL,
        channel VARCHAR(50) NOT NULL
      );
    `);

    // Create invites table for pending invites
    await query(`
      CREATE TABLE IF NOT EXISTS invites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'analyst', 'viewer')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (org_id, email)
      );
    `);

    console.log('PostgreSQL database initialized successfully.');
  } catch (err) {
    console.error('Error initializing database tables:', err);
  }
}
