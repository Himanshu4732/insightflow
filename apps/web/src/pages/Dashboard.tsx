import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, Cell as BarCell
} from 'recharts';
import { 
  mockKpis, 
  mockHistoricalRevenue, 
  mockCategories, 
  mockProducts, 
  mockAnomalies,
  AnomalyAlert
} from '../data/mockDashboard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  ShoppingBag, 
  Percent, 
  Sparkles,
  AlertTriangle,
  Radio
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useDashboardKPIs, useRevenueChart, useTopProducts } from '../hooks/useQueries';

// Count-up helper component
function CountUp({ value, formatter = (val: number) => String(Math.round(val)), duration = 1200 }: { value: number; formatter?: (val: number) => string; duration?: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCurrent(end);
      return;
    }

    const totalSteps = duration / 25;
    const stepIncrement = (end - start) / totalSteps;

    const timer = setInterval(() => {
      start += stepIncrement;
      if (start >= end) {
        clearInterval(timer);
        setCurrent(end);
      } else {
        setCurrent(start);
      }
    }, 25);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{formatter(current)}</span>;
}

// Category chart color scheme
const COLORS = ['#7C6FF7', '#A78BFA', '#8B5CF6', '#6D28D9', '#4C1D95'];

interface DashboardProps {
  onWsStatusChange?: (connected: boolean) => void;
}

export default function Dashboard({ onWsStatusChange }: DashboardProps) {
  const { data: serverKpis } = useDashboardKPIs();
  const { data: revenueChart = mockHistoricalRevenue } = useRevenueChart();
  const { data: topProducts = mockProducts } = useTopProducts();

  const [kpis, setKpis] = useState(mockKpis);
  const [alerts, setAlerts] = useState<AnomalyAlert[]>(mockAnomalies);
  const [, setIsWsConnected] = useState(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Sync server loaded KPIs to state
  useEffect(() => {
    if (serverKpis) {
      setKpis(serverKpis);
    }
  }, [serverKpis]);

  // Setup WebSocket connection and Mock fallbacks
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    let socket: Socket | null = null;

    try {
      socket = io(API_URL, {
        reconnectionDelayMax: 10000,
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        setIsWsConnected(true);
        onWsStatusChange?.(true);
      });

      socket.on('disconnect', () => {
        setIsWsConnected(false);
        onWsStatusChange?.(false);
      });

      // Listen for live updates
      socket.on('kpi_update', (updatedKpis) => {
        setKpis(prev => ({
          ...prev,
          totalRevenue: { ...prev.totalRevenue, value: updatedKpis.revenue },
          totalOrders: { ...prev.totalOrders, value: updatedKpis.orders }
        }));
      });

      socket.on('anomaly_alert', (newAlert: AnomalyAlert) => {
        setAlerts(prev => [newAlert, ...prev]);
      });
    } catch (err) {
      console.warn('Socket connection failure, proceeding with simulated stream.');
    }

    // Interval stream fallback to simulate WebSocket triggers
    const interval = setInterval(() => {
      // Simulate KPI variations (+/- 0.5%)
      setKpis(prev => {
        const revDiff = (Math.random() - 0.5) * 1500;
        const ordDiff = Math.random() > 0.6 ? 1 : 0;
        return {
          ...prev,
          totalRevenue: { ...prev.totalRevenue, value: Math.max(0, prev.totalRevenue.value + revDiff) },
          totalOrders: { ...prev.totalOrders, value: Math.max(0, prev.totalOrders.value + ordDiff) }
        };
      });

      // Randomly inject a mock anomaly alert (25% chance every interval trigger)
      if (Math.random() > 0.75) {
        const metrics = ['CPU threshold overload', 'Database deadlock warning', 'Abnormal transaction density', 'Payment gateway timeout'];
        const descriptions = [
          'Operations engine reports core resource allocation spike inside cluster-1.',
          'Postgres client queue exceeded execution locks pool during write buffers.',
          'Detected 125 active parallel checkout routes originating from single subnet.',
          'Stripe webhooks endpoint response delay exceeded 5000ms threshold latency.'
        ];
        const index = Math.floor(Math.random() * metrics.length);
        const severities: ('red' | 'amber' | 'green')[] = ['red', 'amber', 'green'];
        
        const newAlert: AnomalyAlert = {
          id: `sim-a-${Math.random().toString(36).substring(2, 5)}`,
          severity: severities[Math.floor(Math.random() * 3)],
          metric: metrics[index],
          description: descriptions[index],
          time: 'Just now'
        };
        setAlerts(prev => [newAlert, ...prev.slice(0, 5)]); // limit feed buffer to 6
      }
    }, 8000);

    return () => {
      if (socket) socket.disconnect();
      clearInterval(interval);
    };
  }, [onWsStatusChange]);

  // Center total calculation for donut chart
  const categoryTotal = mockCategories.reduce((acc, curr) => acc + curr.value, 0);

  // Formatters
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('en-US').format(val);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Row 1 — KPI Cards (4 columns) */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Revenue */}
        <Card className="hover:border-border-hover/60 transition-colors flex items-center justify-between">
          <div className="space-y-1.5 text-left">
            <span className="text-xs font-display font-medium text-text-muted">Total Revenue</span>
            <div className="text-2xl font-display font-semibold text-text-primary">
              <CountUp value={kpis.totalRevenue.value} formatter={formatCurrency} />
            </div>
            <div className="flex items-center gap-1 text-[11px] font-sans font-medium text-success">
              <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
              <span>{kpis.totalRevenue.change} vs last month</span>
            </div>
          </div>
          <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent">
            <DollarSign className="h-5 w-5" />
          </div>
        </Card>

        {/* KPI 2: Orders */}
        <Card className="hover:border-border-hover/60 transition-colors flex items-center justify-between">
          <div className="space-y-1.5 text-left">
            <span className="text-xs font-display font-medium text-text-muted">Total Orders</span>
            <div className="text-2xl font-display font-semibold text-text-primary">
              <CountUp value={kpis.totalOrders.value} formatter={formatNumber} />
            </div>
            <div className="flex items-center gap-1 text-[11px] font-sans font-medium text-success">
              <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
              <span>{kpis.totalOrders.change} vs last month</span>
            </div>
          </div>
          <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent">
            <ShoppingBag className="h-5 w-5" />
          </div>
        </Card>

        {/* KPI 3: Churn Rate */}
        <Card className="hover:border-border-hover/60 transition-colors flex items-center justify-between">
          <div className="space-y-1.5 text-left">
            <span className="text-xs font-display font-medium text-text-muted">Churn Rate</span>
            <div className="text-2xl font-display font-semibold text-text-primary">
              <CountUp value={kpis.churnRate.value} formatter={(val) => `${val.toFixed(1)}%`} />
            </div>
            <div className="flex items-center gap-1 text-[11px] font-sans font-medium text-success">
              <ArrowDownRight className="h-3 w-3 stroke-[2.5]" />
              <span>{kpis.churnRate.change} (lower is better)</span>
            </div>
          </div>
          <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent">
            <Percent className="h-5 w-5" />
          </div>
        </Card>

        {/* KPI 4: Avg Order Value */}
        <Card className="hover:border-border-hover/60 transition-colors flex items-center justify-between">
          <div className="space-y-1.5 text-left">
            <span className="text-xs font-display font-medium text-text-muted">Avg Order Value</span>
            <div className="text-2xl font-display font-semibold text-text-primary">
              <CountUp value={kpis.avgOrderValue.value} formatter={formatCurrency} />
            </div>
            <div className="flex items-center gap-1 text-[11px] font-sans font-medium text-success">
              <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
              <span>{kpis.avgOrderValue.change} vs last month</span>
            </div>
          </div>
          <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent">
            <Sparkles className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Row 2 — Charts (Left 65% + Right 35%) */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart (65% / 2 cols) */}
        <Card className="lg:col-span-2 space-y-6 flex flex-col justify-between h-[380px] p-6 text-left">
          <div>
            <h3 className="text-sm font-display font-semibold text-text-primary">Revenue Over Time</h3>
            <p className="text-xs text-text-muted mt-0.5">Historical overview of monthly platform billings</p>
          </div>

          <div className="h-[260px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" vertical={false} />
                <XAxis dataKey="month" stroke="#6B6B8A" tickLine={false} axisLine={false} />
                <YAxis stroke="#6B6B8A" tickLine={false} axisLine={false} tickFormatter={(tick) => `$${tick / 1000}k`} />
                <Tooltip 
                  contentStyle={{ background: '#111118', borderColor: '#1E1E2E', borderRadius: '8px' }}
                  labelStyle={{ color: '#F1F0FF', fontFamily: 'Sora', fontWeight: 'bold' }}
                  itemStyle={{ color: 'var(--accent)' }}
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Pie Chart (35% / 1 col) */}
        <Card className="space-y-4 flex flex-col justify-between h-[380px] p-6 text-left">
          <div>
            <h3 className="text-sm font-display font-semibold text-text-primary">Revenue by Category</h3>
            <p className="text-xs text-text-muted mt-0.5">Top-earning operational products share</p>
          </div>

          <div className="h-[180px] w-full relative flex items-center justify-center">
            {/* Center label */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase font-display font-semibold text-text-muted tracking-wider">Total</span>
              <span className="text-lg font-display font-bold text-text-primary">{formatCurrency(categoryTotal)}</span>
            </div>
            
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {mockCategories.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#111118', borderColor: '#1E1E2E', borderRadius: '8px', fontSize: '11px' }}
                  itemStyle={{ color: '#F1F0FF' }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legends list */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] text-text-muted border-t border-border/40 pt-4">
            {mockCategories.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 truncate">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 3 — Charts (Left 50% + Right 50%) */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Horizontal Bar Chart (Product Sales) */}
        <Card className="space-y-6 flex flex-col justify-between h-[380px] p-6 text-left">
          <div>
            <h3 className="text-sm font-display font-semibold text-text-primary">Top 10 Products by Sales</h3>
            <p className="text-xs text-text-muted mt-0.5">Best performing subscription units sorted descending</p>
          </div>

          <div className="h-[260px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topProducts}
                margin={{ top: 0, right: 10, left: 35, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" horizontal={false} />
                <XAxis type="number" stroke="#6B6B8A" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="#6B6B8A" tickLine={false} axisLine={false} width={120} />
                <Tooltip 
                  contentStyle={{ background: '#111118', borderColor: '#1E1E2E', borderRadius: '8px' }}
                  itemStyle={{ color: '#F1F0FF' }}
                  formatter={(value: any) => [`${value} units`, 'Sales']}
                />
                <Bar 
                  dataKey="sales" 
                  radius={[0, 4, 4, 0]}
                  onMouseEnter={(_, idx) => setHoveredBarIndex(idx)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                >
                  {topProducts.map((_: any, index: number) => (
                    <BarCell 
                      key={`cell-${index}`} 
                      fill={hoveredBarIndex === index ? '#F59E0B' : '#7C6FF7'} 
                      className="transition-colors duration-200"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Live Anomaly Feed (Alert List) */}
        <Card className="space-y-4 flex flex-col justify-between h-[380px] p-6 text-left">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-display font-semibold text-text-primary">Recent Anomaly Alerts</h3>
              <p className="text-xs text-text-muted mt-0.5">Real-time WebSocket warning feed scanner</p>
            </div>
            
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-danger/10 border border-danger/20 text-danger text-[10px] font-display font-bold uppercase tracking-wider animate-pulse">
              <Radio className="h-3 w-3 shrink-0" />
              Live Scanner
            </div>
          </div>

          {/* Anomaly list wrapper */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
            <AnimatePresence initial={false}>
              {alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: -20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="p-3 bg-surface/50 border border-border rounded-lg flex gap-3 text-left hover:border-border-hover transition-colors">
                    <div className={`mt-0.5 p-1 rounded bg-raised shrink-0 flex items-center justify-center ${
                      alert.severity === 'red' ? 'text-danger' : alert.severity === 'amber' ? 'text-warning' : 'text-success'
                    }`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-display font-semibold text-text-primary truncate">{alert.metric}</div>
                        <span className="text-[10px] text-text-hint shrink-0 font-sans">{alert.time}</span>
                      </div>
                      <div className="text-[10px] text-text-muted mt-1 leading-relaxed">{alert.description}</div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={alert.severity === 'red' ? 'danger' : alert.severity === 'amber' ? 'warning' : 'success'} className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0">
                          {alert.severity} severity
                        </Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      </div>
    </div>
  );
}
