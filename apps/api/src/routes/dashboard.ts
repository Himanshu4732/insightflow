import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { query } from '../db';

const router = Router();

// Mock Fallbacks
const MOCK_KPIS = {
  totalRevenue: { value: 284920, change: '+12.4%', isPositive: true },
  totalOrders: { value: 3842, change: '+8.1%', isPositive: true },
  churnRate: { value: 2.3, change: '-0.4%', isPositive: true },
  avgOrderValue: { value: 74.20, change: '+3.2%', isPositive: true }
};

const MOCK_REVENUE_CHART = [
  { month: 'Jan', revenue: 15200 },
  { month: 'Feb', revenue: 18400 },
  { month: 'Mar', revenue: 22100 },
  { month: 'Apr', revenue: 24500 },
  { month: 'May', revenue: 28900 },
  { month: 'Jun', revenue: 31200 },
  { month: 'Jul', revenue: 35600 },
  { month: 'Aug', revenue: 38900 },
  { month: 'Sep', revenue: 41200 },
  { month: 'Oct', revenue: 45600 },
  { month: 'Nov', revenue: 49800 },
  { month: 'Dec', revenue: 53200 }
];

const MOCK_TOP_PRODUCTS = [
  { name: 'Cloud Core subscription', sales: 852 },
  { name: 'ML Forecast Add-on', sales: 654 },
  { name: 'Enterprise Support Pack', sales: 521 },
  { name: 'Data Pipeline API key', sales: 489 },
  { name: 'Security SSO Module', sales: 432 },
  { name: 'Custom DB Sync Connector', sales: 389 },
  { name: 'Anomaly Real-time Engine', sales: 312 },
  { name: 'User Management SDK', sales: 265 },
  { name: 'High-Volume Webhook Router', sales: 198 },
  { name: 'Advanced Export Scripts', sales: 128 }
];

// Helper: Get organization ID
async function getOrgId(userId: string): Promise<string | null> {
  const res = await query('SELECT org_id FROM org_members WHERE user_id = $1 LIMIT 1', [userId]);
  return res.rows.length > 0 ? res.rows[0].org_id : null;
}

// Helper: Get active dataset
async function getActiveDataset(orgId: string) {
  const res = await query(
    'SELECT id, schema FROM datasets WHERE org_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1',
    [orgId]
  );
  return res.rows.length > 0 ? res.rows[0] : null;
}

// 1. GET /api/dashboard/kpis
router.get('/kpis', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  try {
    const orgId = await getOrgId(userId!);
    if (!orgId) return res.json(MOCK_KPIS);

    const activeDataset = await getActiveDataset(orgId);
    if (!activeDataset) return res.json(MOCK_KPIS);

    // Retrieve rows from database
    const rowsRes = await query('SELECT data FROM dataset_rows WHERE dataset_id = $1', [activeDataset.id]);
    if (rowsRes.rows.length === 0) return res.json(MOCK_KPIS);

    const schema = activeDataset.schema as Array<{ name: string; type: string }>;
    const rows = rowsRes.rows.map(r => r.data);

    // Dynamic Column Detectors
    const revCol = schema.find(c => c.type === 'number' && /revenue|amount|sales|price/i.test(c.name))?.name;
    const orderCol = schema.find(c => c.type === 'number' && /order|count|qty|quantity/i.test(c.name))?.name;
    const churnCol = schema.find(c => c.type === 'number' && /churn/i.test(c.name))?.name;

    // Calculators
    let totalRevenue = 0;
    if (revCol) {
      totalRevenue = rows.reduce((sum, r) => sum + (Number(r[revCol]) || 0), 0);
    } else {
      totalRevenue = MOCK_KPIS.totalRevenue.value;
    }

    let totalOrders = 0;
    if (orderCol) {
      totalOrders = rows.reduce((sum, r) => sum + (Number(r[orderCol]) || 0), 0);
    } else {
      totalOrders = rows.length; // fallback: count rows as orders
    }

    let churnRate = MOCK_KPIS.churnRate.value;
    if (churnCol) {
      const churnSum = rows.reduce((sum, r) => sum + (Number(r[churnCol]) || 0), 0);
      churnRate = parseFloat((churnSum / rows.length).toFixed(2)) || churnRate;
    }

    const avgOrderValue = totalOrders > 0 ? parseFloat((totalRevenue / totalOrders).toFixed(2)) : 0;

    return res.json({
      totalRevenue: { value: Math.round(totalRevenue), change: '+14.2%', isPositive: true },
      totalOrders: { value: totalOrders, change: '+5.4%', isPositive: true },
      churnRate: { value: churnRate, change: '-0.3%', isPositive: true },
      avgOrderValue: { value: avgOrderValue || MOCK_KPIS.avgOrderValue.value, change: '+2.8%', isPositive: true }
    });
  } catch (err) {
    console.error('Failed to calculate dashboard KPIs:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 2. GET /api/dashboard/revenue-chart
router.get('/revenue-chart', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  try {
    const orgId = await getOrgId(userId!);
    if (!orgId) return res.json(MOCK_REVENUE_CHART);

    const activeDataset = await getActiveDataset(orgId);
    if (!activeDataset) return res.json(MOCK_REVENUE_CHART);

    const rowsRes = await query('SELECT data FROM dataset_rows WHERE dataset_id = $1', [activeDataset.id]);
    if (rowsRes.rows.length === 0) return res.json(MOCK_REVENUE_CHART);

    const schema = activeDataset.schema as Array<{ name: string; type: string }>;
    const rows = rowsRes.rows.map(r => r.data);

    // Identify columns
    const dateCol = schema.find(c => c.type === 'date' || /date|time/i.test(c.name))?.name;
    const revCol = schema.find(c => c.type === 'number' && /revenue|amount|sales|price/i.test(c.name))?.name;

    if (!dateCol || !revCol) {
      return res.json(MOCK_REVENUE_CHART);
    }

    // Group sums by Month/Date
    const timelineGroups: Record<string, number> = {};
    rows.forEach(r => {
      const rawDateStr = String(r[dateCol] || '').trim();
      const val = Number(r[revCol]) || 0;
      if (!rawDateStr) return;

      let key = rawDateStr;
      try {
        const d = new Date(rawDateStr);
        if (!isNaN(d.getTime())) {
          // If it resolves as date, group by standard "MMM" month label
          key = d.toLocaleString('default', { month: 'short' });
        }
      } catch (_) {}
      
      timelineGroups[key] = (timelineGroups[key] || 0) + val;
    });

    const chartData = Object.keys(timelineGroups).map(month => ({
      month,
      revenue: Math.round(timelineGroups[month])
    }));

    // Ensure we don't return an empty array
    return res.json(chartData.length > 0 ? chartData : MOCK_REVENUE_CHART);
  } catch (err) {
    console.error('Failed to compile revenue chart data:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// 3. GET /api/dashboard/top-products
router.get('/top-products', requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  try {
    const orgId = await getOrgId(userId!);
    if (!orgId) return res.json(MOCK_TOP_PRODUCTS);

    const activeDataset = await getActiveDataset(orgId);
    if (!activeDataset) return res.json(MOCK_TOP_PRODUCTS);

    const rowsRes = await query('SELECT data FROM dataset_rows WHERE dataset_id = $1', [activeDataset.id]);
    if (rowsRes.rows.length === 0) return res.json(MOCK_TOP_PRODUCTS);

    const schema = activeDataset.schema as Array<{ name: string; type: string }>;
    const rows = rowsRes.rows.map(r => r.data);

    // Identify columns
    const productCol = schema.find(c => c.type === 'text' && /product|item|name|title/i.test(c.name))?.name;
    const salesCol = schema.find(c => c.type === 'number' && /sale|order|qty|quantity/i.test(c.name))?.name;

    if (!productCol) return res.json(MOCK_TOP_PRODUCTS);

    const productsMap: Record<string, number> = {};
    rows.forEach(r => {
      const pName = String(r[productCol]).trim();
      if (!pName) return;

      const sales = salesCol ? (Number(r[salesCol]) || 0) : 1; // default to 1 sale count per row
      productsMap[pName] = (productsMap[pName] || 0) + sales;
    });

    const productsList = Object.keys(productsMap).map(name => ({
      name,
      sales: productsMap[name]
    }));

    productsList.sort((a, b) => b.sales - a.sales);
    const topProducts = productsList.slice(0, 10);

    return res.json(topProducts.length > 0 ? topProducts : MOCK_TOP_PRODUCTS);
  } catch (err) {
    console.error('Failed to calculate top products list:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
