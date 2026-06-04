export interface HistoricalDataPoint {
  month: string;
  revenue: number;
}

export interface CategoryDataPoint {
  name: string;
  value: number;
}

export interface ProductDataPoint {
  name: string;
  sales: number;
}

export interface AnomalyAlert {
  id: string;
  severity: 'red' | 'amber' | 'green';
  metric: string;
  description: string;
  time: string;
}

export const mockDatasets = [
  { id: 'ds-1', name: 'Q2 Sales & Traffic Data.csv' },
  { id: 'ds-2', name: 'Google Sheets Ingestion - Live.csv' },
  { id: 'ds-3', name: 'Customer Subscriptions - Production.csv' }
];

export const mockKpis = {
  totalRevenue: { value: 284920, change: '+12.4%', isPositive: true },
  totalOrders: { value: 3842, change: '+8.1%', isPositive: true },
  churnRate: { value: 2.3, change: '-0.4%', isPositive: true }, // lower is positive/better
  avgOrderValue: { value: 74.20, change: '+3.2%', isPositive: true }
};

export const mockHistoricalRevenue: HistoricalDataPoint[] = [
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

export const mockCategories: CategoryDataPoint[] = [
  { name: 'SaaS Platform', value: 142460 },
  { name: 'Consulting Services', value: 56984 },
  { name: 'Developer License', value: 42738 },
  { name: 'Enterprise Hardware', value: 28492 },
  { name: 'Premium Support', value: 14246 }
];

export const mockProducts: ProductDataPoint[] = [
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

export const mockAnomalies: AnomalyAlert[] = [
  {
    id: 'a-1',
    severity: 'red',
    metric: 'Churn rate spike',
    description: 'Subscriptions dropped by 8% over the past 4 hours in APAC cluster.',
    time: '2 mins ago'
  },
  {
    id: 'a-2',
    severity: 'amber',
    metric: 'High Response latency',
    description: 'API gateway latency increased from 42ms to 280ms in us-east-1.',
    time: '15 mins ago'
  },
  {
    id: 'a-3',
    severity: 'green',
    metric: 'Spike in active signups',
    description: 'Daily user signups exceed standard standard deviation bounds (+25%).',
    time: '1 hour ago'
  },
  {
    id: 'a-4',
    severity: 'amber',
    metric: 'Forecast variance alert',
    description: 'Expected revenue bounds drift by 4.2% from forecast predictions.',
    time: '3 hours ago'
  }
];
