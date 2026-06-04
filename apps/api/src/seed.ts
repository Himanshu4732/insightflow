import { query, pool } from './db';
import { initDb } from './db/init';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Setup deterministic pseudo-random number generator
let seedVal = 12345;
function random() {
  const x = Math.sin(seedVal++) * 10000;
  return x - Math.floor(x);
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(random() * arr.length)];
}

function randomRange(min: number, max: number): number {
  return min + random() * (max - min);
}

async function runSeed() {
  console.log('Starting database seeding...');

  // 1. Initialize DB tables
  await initDb();

  // 2. Create Default Workspace and User
  let orgId = '';
  const orgCheck = await query('SELECT id FROM organisations LIMIT 1');
  if (orgCheck.rowCount === 0) {
    const orgRes = await query(
      "INSERT INTO organisations (name, slug, plan) VALUES ($1, $2, $3) RETURNING id",
      ['Acme Corporation', 'acme-corp', 'pro']
    );
    orgId = orgRes.rows[0].id;
    console.log(`Created default organization: Acme Corporation (ID: ${orgId})`);
  } else {
    orgId = orgCheck.rows[0].id;
    // Ensure the plan is 'pro' so that settings / billing look correct
    await query("UPDATE organisations SET plan = 'pro' WHERE id = $1", [orgId]);
    console.log(`Using existing organization (ID: ${orgId})`);
  }

  let userId = '';
  const passwordHash = await bcrypt.hash('password123', 10);
  const userCheck = await query('SELECT id FROM users LIMIT 1');
  if (userCheck.rowCount === 0) {
    const userRes = await query(
      `INSERT INTO users (email, name, password_hash, avatar_url) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [
        'admin@insightflow.com', 
        'Admin User', 
        passwordHash, 
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
      ]
    );
    userId = userRes.rows[0].id;
    console.log(`Created default user: admin@insightflow.com (ID: ${userId})`);

    await query(
      "INSERT INTO org_members (org_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [orgId, userId, 'admin']
    );
  } else {
    userId = userCheck.rows[0].id;
    console.log(`Using existing user (ID: ${userId})`);
    await query(
      "INSERT INTO org_members (org_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [orgId, userId, 'admin']
    );
  }

  // 3. Clear existing seeded orders & datasets
  console.log('Clearing old orders and dataset files...');
  await query("DELETE FROM orders WHERE org_id = $1", [orgId]);
  await query("DELETE FROM datasets WHERE org_id = $1 AND filename = $2", [orgId, 'ecommerce_sales_50k.csv']);

  // 4. Calculate day counts and weights
  console.log('Generating e-commerce timeline (2 years)...');
  const weights: number[] = [];
  let totalWeight = 0;

  for (let d = 0; d < 730; d++) {
    const date = new Date(2024, 5, 4); // June 4, 2024
    date.setDate(date.getDate() + d);

    // Upward trend: +80% over 2 years
    const trend = 1.0 + (d / 730) * 0.8;

    // Seasonality (Nov/Dec spikes)
    const month = date.getMonth(); // 10 = Nov, 11 = Dec
    const seasonality = (month === 10 || month === 11) ? 1.8 : 1.0;

    // Weekly seasonality (weekends are lower, mid-week is slightly higher)
    const dayOfWeek = date.getDay();
    const weekly = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.75 : (dayOfWeek === 3 || dayOfWeek === 4 ? 1.1 : 1.0);

    // Anomalies
    let anomaly = 1.0;
    if (d === 200) {
      anomaly = 5.0; // Flash Sale Spike
    } else if (d === 450) {
      anomaly = 0.05; // Outage Dip
    }

    const w = trend * seasonality * weekly * anomaly;
    weights.push(w);
    totalWeight += w;
  }

  // Allocate exact target of 50,000 rows
  let allocated = 0;
  const dailyCounts = weights.map(w => {
    const count = Math.round((w / totalWeight) * 50000);
    allocated += count;
    return count;
  });

  const diff = 50000 - allocated;
  dailyCounts[729] += diff;

  // E-commerce entities setup
  const categories = ['Electronics', 'Clothing', 'Food', 'Home', 'Sports'];
  const products: Record<string, string[]> = {
    Electronics: ['Smartwatch Pro', 'Wireless Earbuds', 'Noise Cancelling Headphones', 'Bluetooth Speaker', 'HD Projector'],
    Clothing: ['Activewear Jacket', 'Slim Fit Denim', 'Breathable Running Shoes', 'Wool Blend Sweater', 'Classic Sunglasses'],
    Food: ['Organic Matcha Powder', 'Artisanal Coffee Beans', 'Gourmet Dark Chocolate', 'Cold Pressed Olive Oil', 'Raw Manuka Honey'],
    Home: ['Ergonomic Desk Chair', 'Smart LED Bulb Pack', 'Air Purifier', 'Memory Foam Pillow', 'Aromatic Diffuser'],
    Sports: ['Yoga Mat Non-Slip', 'Adjustable Dumbbells', 'Waterproof Backpack', 'Resistance Bands Set', 'Trail Running Hydration Vest']
  };
  const categoryBasePrices: Record<string, { min: number; max: number }> = {
    Electronics: { min: 80, max: 400 },
    Clothing: { min: 30, max: 120 },
    Food: { min: 15, max: 50 },
    Home: { min: 40, max: 250 },
    Sports: { min: 20, max: 150 }
  };
  const countries = ['IN', 'US', 'UK', 'DE', 'AU', 'CA', 'SG', 'AE'];
  const channels = ['Organic', 'Paid', 'Referral'];

  // Register dataset metadata
  const datasetId = crypto.randomUUID();
  const schema = [
    { name: 'date', type: 'date' },
    { name: 'order_id', type: 'text' },
    { name: 'customer_id', type: 'text' },
    { name: 'product_name', type: 'text' },
    { name: 'category', type: 'text' },
    { name: 'quantity', type: 'number' },
    { name: 'unit_price', type: 'number' },
    { name: 'total_revenue', type: 'number' },
    { name: 'country', type: 'text' },
    { name: 'channel', type: 'text' }
  ];

  await query(
    `INSERT INTO datasets (id, org_id, filename, row_count, schema) 
     VALUES ($1, $2, $3, $4, $5)`,
    [datasetId, orgId, 'ecommerce_sales_50k.csv', 50000, JSON.stringify(schema)]
  );
  console.log(`Registered dataset in explorer index: ecommerce_sales_50k.csv (ID: ${datasetId})`);

  // Batch insert orders & explorer data
  const batchSize = 2500;
  let ordersBatch: any[] = [];
  let datasetRowsBatch: any[] = [];
  let overallRowIndex = 0;

  async function insertBatch(orders: any[], rows: any[]) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Orders insert
      const orderValues: any[] = [];
      const orderPlaceholders: string[] = [];
      orders.forEach((o, idx) => {
        const offset = orderValues.length;
        orderPlaceholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11})`);
        orderValues.push(orgId, o.date, o.order_id, o.customer_id, o.product_name, o.category, o.quantity, o.unit_price, o.total_revenue, o.country, o.channel);
      });

      const ordersQuery = `
        INSERT INTO orders (org_id, date, order_id, customer_id, product_name, category, quantity, unit_price, total_revenue, country, channel)
        VALUES ${orderPlaceholders.join(', ')}
      `;
      await client.query(ordersQuery, orderValues);

      // Dataset rows insert
      const rowValues: any[] = [];
      const rowPlaceholders: string[] = [];
      rows.forEach((r, idx) => {
        const offset = rowValues.length;
        rowPlaceholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
        rowValues.push(r.dataset_id, r.row_index, JSON.stringify(r.data));
      });

      const rowsQuery = `
        INSERT INTO dataset_rows (dataset_id, row_index, data)
        VALUES ${rowPlaceholders.join(', ')}
      `;
      await client.query(rowsQuery, rowValues);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Batch insertion failed:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  console.log('Generating and inserting 50,000 data rows in batches...');

  for (let d = 0; d < 730; d++) {
    const count = dailyCounts[d];
    const dateObj = new Date(2024, 5, 4);
    dateObj.setDate(dateObj.getDate() + d);
    const dateStr = dateObj.toISOString();

    for (let j = 0; j < count; j++) {
      const category = randomChoice(categories);
      const product = randomChoice(products[category]);

      // Channel allocation
      let channel = 'Organic';
      if (d === 200) {
        // Flash sale
        const r = random();
        channel = r < 0.85 ? 'Paid' : (r < 0.95 ? 'Organic' : 'Referral');
      } else if (d >= 640) {
        // Marketing drift shift
        const probPaid = 0.33 + ((d - 640) / (729 - 640)) * 0.32; // up to 65%
        const r = random();
        if (r < probPaid) {
          channel = 'Paid';
        } else {
          channel = r < probPaid + (1 - probPaid) / 2 ? 'Organic' : 'Referral';
        }
      } else {
        channel = randomChoice(channels);
      }

      // Country weighting (US ~30%, IN ~20%, UK ~15%, DE ~10%, rest uniform)
      let country = 'US';
      const cVal = random();
      if (cVal < 0.3) country = 'US';
      else if (cVal < 0.5) country = 'IN';
      else if (cVal < 0.65) country = 'UK';
      else if (cVal < 0.75) country = 'DE';
      else {
        const restCountries = ['AU', 'CA', 'SG', 'AE'];
        country = restCountries[Math.floor(random() * restCountries.length)];
      }

      const quantity = Math.floor(random() * 4) + 1;
      let unitPrice = randomRange(categoryBasePrices[category].min, categoryBasePrices[category].max);

      // Electronics prices gradual drift (increases by up to 40% in last 90 days)
      if (category === 'Electronics' && d >= 640) {
        const driftMult = 1.0 + ((d - 640) / (729 - 640)) * 0.4;
        unitPrice *= driftMult;
      }

      unitPrice = Number(unitPrice.toFixed(2));
      const totalRevenue = Number((quantity * unitPrice).toFixed(2));

      const orderId = `ORD-${dateObj.getFullYear()}${(dateObj.getMonth() + 1).toString().padStart(2, '0')}${dateObj.getDate().toString().padStart(2, '0')}-${j.toString().padStart(4, '0')}`;
      const customerId = `CUST-${Math.floor(random() * 5000 + 1).toString().padStart(4, '0')}`;

      const orderRow = {
        date: dateStr,
        order_id: orderId,
        customer_id: customerId,
        product_name: product,
        category,
        quantity,
        unit_price: unitPrice,
        total_revenue: totalRevenue,
        country,
        channel
      };

      ordersBatch.push(orderRow);
      datasetRowsBatch.push({
        dataset_id: datasetId,
        row_index: overallRowIndex,
        data: orderRow
      });

      overallRowIndex++;

      if (ordersBatch.length >= batchSize) {
        await insertBatch(ordersBatch, datasetRowsBatch);
        ordersBatch = [];
        datasetRowsBatch = [];
        console.log(`Seeded ${overallRowIndex} / 50000 rows...`);
      }
    }
  }

  // Insert remaining rows
  if (ordersBatch.length > 0) {
    await insertBatch(ordersBatch, datasetRowsBatch);
    console.log(`Seeded ${overallRowIndex} / 50000 rows...`);
  }

  console.log('Database seeding completed successfully!');
  pool.end();
}

runSeed().catch(err => {
  console.error('Fatal error during seed execution:', err);
  pool.end();
  process.exit(1);
});
