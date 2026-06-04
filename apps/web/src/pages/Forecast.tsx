import { useState, useEffect } from 'react';
import { 
  Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Line, ComposedChart, Scatter
} from 'recharts';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  TrendingUp, 
  Settings, 
  AlertTriangle, 
  RefreshCw,
  TrendingDown
} from 'lucide-react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

interface ForecastPoint {
  date: string;
  historicalValue?: number;
  forecastValue?: number;
  lower?: number;
  upper: number;
  isAnomaly?: boolean;
  anomalyVal?: number | null;
}

// Generate 60 days of detailed historical time series for the demo
const generateHistoricalData = (metric: string) => {
  const data = [];
  const baseValue = metric === 'revenue' ? 8200 : metric === 'orders' ? 120 : 25;
  const now = new Date();
  
  for (let i = 60; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    
    // Add linear growth + seasonal weekly variation + random noise
    const trend = baseValue + (60 - i) * (baseValue * 0.005);
    const weeklyWave = Math.sin((60 - i) * 2 * Math.PI / 7.0) * (baseValue * 0.08);
    const noise = (Math.random() - 0.5) * (baseValue * 0.04);
    
    // Ingress anomaly spike on day 15 and day 45
    let anomalyTrigger = false;
    let finalVal = trend + weeklyWave + noise;
    if (i === 45) {
      finalVal = trend * 1.55; // spike
      anomalyTrigger = true;
    } else if (i === 15) {
      finalVal = trend * 0.45; // dip
      anomalyTrigger = true;
    }

    data.push({
      date: d.toISOString().split('T')[0],
      value: Math.max(0, parseFloat(finalVal.toFixed(2))),
      isAnomaly: anomalyTrigger
    });
  }
  return data;
};

export default function Forecast() {
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'orders' | 'signups'>('revenue');
  const [horizon, setHorizon] = useState<30 | 60 | 90 | 180>(90);
  const [isComputing, setIsComputing] = useState(false);

  // Core time series values
  const [historicalPoints, setHistoricalPoints] = useState<any[]>([]);
  const [forecastPoints, setForecastPoints] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  // What-if sliders state
  const [growthRate, setGrowthRate] = useState(0); // in percent (-50% to +100%)
  const [seasonalityStrength, setSeasonalityStrength] = useState(1.0); // (0 to 2.0x)

  // Merged chart data
  const [chartData, setChartData] = useState<ForecastPoint[]>([]);

  useEffect(() => {
    // Generate initial history on metric swap
    const history = generateHistoricalData(selectedMetric);
    setHistoricalPoints(history);
    
    // Clean up future forecasts on toggle
    setForecastPoints([]);
    setAnomalies([]);
  }, [selectedMetric]);

  const runMlAnalysis = async () => {
    setIsComputing(true);
    try {
      // 1. Fetch anomalies from backend ML endpoint
      const anomalyRes = await axios.post('/api/ml/anomalies', {
        data: historicalPoints.map(p => ({ date: p.date, value: p.value })),
        sensitivity: 'medium'
      });
      setAnomalies(anomalyRes.data.anomalies || []);

      // 2. Fetch forecast predictions from backend ML endpoint
      const forecastRes = await axios.post('/api/ml/forecast', {
        data: historicalPoints.map(p => ({ date: p.date, value: p.value })),
        periods: horizon,
        freq: 'D'
      });
      setForecastPoints(forecastRes.data.forecast || []);
      
      toast.success('ML forecasting models completed successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'ML analysis failed.');
    } finally {
      setIsComputing(false);
    }
  };

  // Compile combined points for composed charting + apply what-if modifiers locally
  useEffect(() => {
    const combined: ForecastPoint[] = [];

    // Add historical records
    historicalPoints.forEach(p => {
      const isOutlier = anomalies.some(a => a.date === p.date);
      combined.push({
        date: p.date,
        historicalValue: p.value,
        upper: p.value, // history has zero error margin
        isAnomaly: isOutlier,
        anomalyVal: isOutlier ? p.value : null
      });
    });

    // Add forecast projections
    forecastPoints.forEach((p, idx) => {
      // What-if adjustments
      // growth modifier: value * (1 + growthRate/100 * (idx/periods))
      const growthModifier = 1 + (growthRate / 100) * (idx / forecastPoints.length);
      
      // seasonality modifier: variance from linear trend multiplied by seasonalityStrength
      const baseValue = p.value;
      const deviation = p.value - (p.lower + p.upper) / 2;
      const adjustedDeviation = deviation * seasonalityStrength;
      
      const val = baseValue * growthModifier + adjustedDeviation;
      const lower = p.lower * growthModifier + adjustedDeviation;
      const upper = p.upper * growthModifier + adjustedDeviation;

      combined.push({
        date: p.date,
        forecastValue: Math.max(0, parseFloat(val.toFixed(2))),
        lower: Math.max(0, parseFloat(lower.toFixed(2))),
        upper: parseFloat(upper.toFixed(2)),
        isAnomaly: false,
        anomalyVal: null
      });
    });

    setChartData(combined);
  }, [historicalPoints, forecastPoints, anomalies, growthRate, seasonalityStrength]);

  // Output stats
  const finalForecastPoint = chartData[chartData.length - 1];
  const lastHistoryPoint = historicalPoints[historicalPoints.length - 1];

  const predictedEndValue = finalForecastPoint?.forecastValue ?? 0;
  const currentStartValue = lastHistoryPoint?.value ?? 0;

  const expectedGrowth = currentStartValue > 0 
    ? ((predictedEndValue - currentStartValue) / currentStartValue) * 100 
    : 0;

  return (
    <div className="space-y-6 pb-12 text-left selection:bg-accent/30 selection:text-text-primary">
      <Toaster position="top-right" />

      {/* Controls Row */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-4 bg-surface/40 border-border/80">
        <div className="flex flex-wrap items-center gap-4">
          {/* Metric Picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-display font-semibold tracking-wider text-text-hint">Selected Metric</span>
            <select 
              value={selectedMetric}
              onChange={(e: any) => setSelectedMetric(e.target.value)}
              className="bg-base border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="revenue">Monthly Revenue ($)</option>
              <option value="orders">Purchase Orders</option>
              <option value="signups">User Registrations</option>
            </select>
          </div>

          {/* Horizon Selection */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-display font-semibold tracking-wider text-text-hint">Forecast Horizon</span>
            <div className="flex border border-border rounded-lg p-0.5 bg-base">
              {([30, 60, 90, 180] as const).map(h => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={`px-3 py-1 rounded text-xs transition-colors focus:outline-none ${
                    horizon === h 
                      ? 'bg-accent/10 text-accent font-semibold' 
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {h} Days
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button 
          variant="primary" 
          onClick={runMlAnalysis}
          isLoading={isComputing}
          className="gap-2 self-end shadow-lg shadow-accent/25 hover:shadow-accent/45 py-2.5 px-5"
        >
          <RefreshCw className={`h-4 w-4 ${isComputing ? 'animate-spin' : ''}`} />
          Run Predictive Models
        </Button>
      </Card>

      {/* Time Series Composed Chart */}
      <Card className="p-6 space-y-4 bg-surface/30 border-border/60">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-display font-semibold text-text-primary flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              Statistical Forecasting Model
            </h3>
            <p className="text-xs text-text-muted mt-0.5">Prophet projection model with anomaly overlays</p>
          </div>
          
          <div className="flex items-center gap-4 text-[10px] text-text-muted font-medium">
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-[#7C6FF7]" /> Historical</div>
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 border border-dashed border-[#A78BFA]" /> Forecast</div>
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 bg-[#7C6FF7]/15" /> Confidence Band</div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-danger" /> Anomaly</div>
          </div>
        </div>

        {/* Composed Chart Frame */}
        <div className="h-[350px] w-full text-xs bg-base/20 border border-border/40 rounded-xl p-4">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" vertical={false} />
                <XAxis dataKey="date" stroke="#6B6B8A" tickLine={false} axisLine={false} />
                <YAxis stroke="#6B6B8A" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#111118', borderColor: '#1E1E2E', borderRadius: '8px' }}
                  labelStyle={{ color: '#F1F0FF', fontFamily: 'Sora', fontWeight: 'bold' }}
                />
                
                {/* Confidence intervals (Area representation) */}
                <Area 
                  type="monotone" 
                  dataKey="upper" 
                  stroke="none"
                  fill="var(--accent)" 
                  fillOpacity={0.08} 
                />
                <Area 
                  type="monotone" 
                  dataKey="lower" 
                  stroke="none"
                  fill="var(--bg-base)" 
                  fillOpacity={1} 
                />

                {/* Historical data line */}
                <Line 
                  type="monotone" 
                  dataKey="historicalValue" 
                  stroke="var(--accent)" 
                  strokeWidth={2.5} 
                  dot={false}
                  activeDot={{ r: 5 }} 
                />

                {/* Forecast projection line */}
                <Line 
                  type="monotone" 
                  dataKey="forecastValue" 
                  stroke="var(--accent)" 
                  strokeWidth={2.5} 
                  strokeDasharray="6 4"
                  dot={false} 
                  activeDot={{ r: 5 }}
                />

                {/* Anomaly Scatter overlay */}
                <Scatter 
                  dataKey="anomalyVal" 
                  fill="var(--danger)" 
                  shape="circle" 
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-3">
              <TrendingUp className="h-10 w-10 text-text-hint animate-pulse" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Ready to model metrics</h4>
                <p className="text-xs text-text-muted">Click the run prediction button above to launch time-series modeling.</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Grid: What-if Sliders (Left 60%) + Metrics Summary (Right 40%) */}
      {forecastPoints.length > 0 && (
        <div className="grid md:grid-cols-5 gap-6">
          {/* Sliders (60%) */}
          <Card className="md:col-span-3 p-6 space-y-6 bg-surface/30 border-border/60">
            <div>
              <h3 className="text-sm font-display font-semibold text-text-primary flex items-center gap-2">
                <Settings className="h-4 w-4 text-accent" />
                What-If Forecasting Modifiers
              </h3>
              <p className="text-xs text-text-muted mt-0.5">Recalculate expected results in real-time on client side</p>
            </div>

            {/* Slider 1: Growth Rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-display font-medium">
                <span className="text-text-muted">Adjust Growth Rate</span>
                <span className={`font-semibold ${growthRate > 0 ? 'text-success' : growthRate < 0 ? 'text-danger' : 'text-text-primary'}`}>
                  {growthRate > 0 ? `+${growthRate}%` : `${growthRate}%`}
                </span>
              </div>
              <input 
                type="range" 
                min="-50" 
                max="100" 
                value={growthRate}
                onChange={(e) => setGrowthRate(Number(e.target.value))}
                className="w-full h-1 bg-raised rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <div className="flex justify-between text-[10px] text-text-hint">
                <span>-50% Dip</span>
                <span>Baseline</span>
                <span>+100% Boost</span>
              </div>
            </div>

            {/* Slider 2: Seasonality */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-display font-medium">
                <span className="text-text-muted">Seasonality Amplitude</span>
                <span className="font-semibold text-accent">
                  {seasonalityStrength.toFixed(1)}x
                </span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="0.1"
                value={seasonalityStrength}
                onChange={(e) => setSeasonalityStrength(Number(e.target.value))}
                className="w-full h-1 bg-raised rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <div className="flex justify-between text-[10px] text-text-hint">
                <span>Flat (0x)</span>
                <span>Standard (1x)</span>
                <span>Amplified (2x)</span>
              </div>
            </div>
          </Card>

          {/* Forecast Summary Cards (40%) */}
          <div className="md:col-span-2 flex flex-col gap-6">
            {/* Predicted value */}
            <Card className="flex-1 flex flex-col justify-between p-6 bg-surface/30 border-border/60">
              <div className="text-left space-y-1">
                <div className="text-xs font-display font-medium text-text-muted">Predicted End Value</div>
                <div className="text-3xl font-display font-bold text-text-primary">
                  {selectedMetric === 'revenue' ? formatCurrency(predictedEndValue) : formatNumber(predictedEndValue)}
                </div>
              </div>

              {/* Growth calculation */}
              <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-4">
                <span className="text-xs text-text-muted">Expected growth</span>
                <div className={`flex items-center gap-1 text-xs font-display font-semibold ${
                  expectedGrowth >= 0 ? 'text-success' : 'text-danger'
                }`}>
                  {expectedGrowth >= 0 ? <TrendingUp className="h-4.5 w-4.5" /> : <TrendingDown className="h-4.5 w-4.5" />}
                  <span>{expectedGrowth >= 0 ? `+${expectedGrowth.toFixed(1)}%` : `${expectedGrowth.toFixed(1)}%`}</span>
                </div>
              </div>
            </Card>

            {/* Risk rating */}
            <Card className="flex flex-col justify-between p-6 bg-surface/30 border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-display font-medium text-text-muted">System Risk Level</span>
                <Badge variant={anomalies.length > 2 ? 'danger' : anomalies.length > 0 ? 'warning' : 'success'}>
                  {anomalies.length > 2 ? 'High Risk' : anomalies.length > 0 ? 'Medium Risk' : 'Low Risk'}
                </Badge>
              </div>
              <div className="flex gap-3 items-start text-xs text-text-muted mt-4 border-t border-border/40 pt-4 text-left">
                <AlertTriangle className="h-4.5 w-4.5 text-warning mt-0.5 shrink-0" />
                <p className="leading-normal">
                  Found <strong className="text-text-primary">{anomalies.length} outliers</strong> in historical dataset bounds. Predictions carry increased margin limits.
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers
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
