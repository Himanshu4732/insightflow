import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ExternalLink, 
  BellRing, 
  Settings2, 
  Sliders, 
  Mail, 
  Webhook, 
  Plus, 
  Info,
  Radio
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { mockAnomalies, AnomalyAlert } from '../data/mockDashboard';

export default function Alerts() {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>(mockAnomalies);
  
  // Configuration State
  const [sensitivity, setSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [slackAlerts, setSlackAlerts] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('https://api.insightflow.io/webhooks/alerts');
  const [isLiveSimulating, setIsLiveSimulating] = useState(true);
  
  // Custom configuration targets
  const [zScoreThreshold, setZScoreThreshold] = useState(2.5);

  // Counters
  const criticalCount = alerts.filter(a => a.severity === 'red').length;
  const warningCount = alerts.filter(a => a.severity === 'amber').length;
  const resolvedCount = alerts.filter(a => a.severity === 'green').length;

  // Live simulation for anomalies
  useEffect(() => {
    if (!isLiveSimulating) return;

    const interval = setInterval(() => {
      // 20% chance to trigger an anomaly alert on each interval
      if (Math.random() > 0.8) {
        const metrics = [
          'Memory leakage detection',
          'API concurrency flood',
          'Unusual traffic deviation',
          'DB connection threshold'
        ];
        const descriptions = [
          'V8 garbage collector failed to reclaim 1.2GB allocated inside memory buffers.',
          'Rate limits exceeded on /api/data/upload route: 450 requests/min from single origin.',
          'Outlier traffic count detected (+18% above rolling historical average bounds).',
          'Active pg pool connections reached 98% capacity under high queue queries.'
        ];
        
        const randIdx = Math.floor(Math.random() * metrics.length);
        const severities: ('red' | 'amber' | 'green')[] = ['red', 'amber', 'green'];
        const chosenSeverity = severities[Math.floor(Math.random() * 3)];
        
        const newAlert: AnomalyAlert = {
          id: `sim-a-${Math.random().toString(36).substring(2, 6)}`,
          severity: chosenSeverity,
          metric: metrics[randIdx],
          description: descriptions[randIdx],
          time: 'Just now'
        };

        setAlerts(prev => [newAlert, ...prev]);
        
        if (chosenSeverity === 'red') {
          toast.error(`CRITICAL: ${metrics[randIdx]} detected!`, {
            icon: '🚨',
            duration: 4000
          });
        } else if (chosenSeverity === 'amber') {
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[#1E1E2E] border border-warning/30 shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4`}>
              <div className="flex-1 w-0">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-semibold font-display text-text-primary">WARNING ALERT</p>
                    <p className="mt-1 text-xs text-text-muted">{metrics[randIdx]}</p>
                  </div>
                </div>
              </div>
            </div>
          ));
        } else {
          toast.success(`RESOLVED: ${metrics[randIdx]} resolved.`, {
            icon: '✅'
          });
        }
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [isLiveSimulating]);

  // Actions
  const handleDismiss = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    toast.success('Alert dismissed');
  };

  const handleDismissAll = () => {
    setAlerts([]);
    toast.success('All alerts cleared');
  };

  const handleCreateTicket = (alert: AnomalyAlert) => {
    const ticketId = `INF-${Math.floor(Math.random() * 900) + 100}`;
    toast.success(`Ticket ${ticketId} created in Linear for ${alert.metric}!`, {
      icon: '🎫',
      style: {
        background: '#1A1A24',
        border: '1px solid #7C6FF7',
        color: '#FFFFFF'
      }
    });
  };

  const handleTriggerManual = () => {
    const manualAlert: AnomalyAlert = {
      id: `manual-a-${Math.random().toString(36).substring(2, 6)}`,
      severity: 'red',
      metric: 'Manual stress test trigger',
      description: 'Operator simulated a database write delay peak (+450ms latency spike).',
      time: 'Just now'
    };
    setAlerts(prev => [manualAlert, ...prev]);
    toast.error('Triggered Manual Critical Anomaly!', {
      icon: '🔥'
    });
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Anomaly alert settings updated successfully!', {
      icon: '💾'
    });
  };

  return (
    <div className="space-y-6 pb-12 text-left selection:bg-accent/30 selection:text-text-primary">
      <Toaster position="top-right" />

      {/* Control panel row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface/30 p-4 border border-border/80 rounded-xl">
        <div className="space-y-1">
          <h2 className="text-lg font-display font-bold flex items-center gap-2 text-text-primary">
            <BellRing className="h-5 w-5 text-accent" />
            Anomaly & Outlier Monitoring
          </h2>
          <p className="text-xs text-text-muted">Real-time isolation forest heuristics detecting metric deviations</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Simulator Status Badge */}
          <button 
            onClick={() => {
              setIsLiveSimulating(!isLiveSimulating);
              toast(isLiveSimulating ? 'Live streams paused' : 'Live simulated alerts active', { icon: '🔄' });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold focus:outline-none transition-all duration-200 ${
              isLiveSimulating 
                ? 'bg-accent/10 border-accent/25 text-accent shadow-[0_0_12px_rgba(124,111,247,0.15)]' 
                : 'bg-surface/50 border-border text-text-muted hover:text-text-primary'
            }`}
          >
            <Radio className={`h-3.5 w-3.5 ${isLiveSimulating ? 'animate-pulse' : ''}`} />
            {isLiveSimulating ? 'Live Feed Active' : 'Feed Paused'}
          </button>

          <Button variant="secondary" onClick={handleTriggerManual} size="sm" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Trigger Test Alert
          </Button>
        </div>
      </div>

      {/* Counter metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total alerts */}
        <Card className="p-4 bg-surface/30 border-border/40 hover:border-border/60 hoverEffect">
          <div className="text-[10px] uppercase font-display font-semibold tracking-wider text-text-hint">Total Incidents</div>
          <div className="text-2xl font-display font-bold mt-1.5 text-text-primary">{alerts.length}</div>
          <div className="text-[10px] text-text-muted mt-1.5 flex items-center gap-1">
            <Info className="h-3 w-3 text-accent" />
            Active monitoring bounds
          </div>
        </Card>

        {/* Critical Red alerts */}
        <Card className="p-4 bg-surface/30 border-border/40 hover:border-danger/30 hoverEffect relative overflow-hidden group">
          <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-danger" />
          <div className="text-[10px] uppercase font-display font-semibold tracking-wider text-text-hint">Critical Alerts</div>
          <div className="text-2xl font-display font-bold mt-1.5 text-danger">{criticalCount}</div>
          <div className="text-[10px] text-text-muted mt-1.5">Z-score &gt; {zScoreThreshold} deviations</div>
        </Card>

        {/* Amber warnings */}
        <Card className="p-4 bg-surface/30 border-border/40 hover:border-warning/30 hoverEffect relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-warning" />
          <div className="text-[10px] uppercase font-display font-semibold tracking-wider text-text-hint">Warnings</div>
          <div className="text-2xl font-display font-bold mt-1.5 text-warning">{warningCount}</div>
          <div className="text-[10px] text-text-muted mt-1.5">Anomaly score &gt; 0.05</div>
        </Card>

        {/* Green Resolved alerts */}
        <Card className="p-4 bg-surface/30 border-border/40 hover:border-success/30 hoverEffect relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-success" />
          <div className="text-[10px] uppercase font-display font-semibold tracking-wider text-text-hint">Resolved</div>
          <div className="text-2xl font-display font-bold mt-1.5 text-success">{resolvedCount}</div>
          <div className="text-[10px] text-text-muted mt-1.5">Self-healed &amp; confirmed</div>
        </Card>
      </div>

      {/* Main split grid: Alerts (Left 65%) + Config Panel (Right 35%) */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Alert lists feed */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <h3 className="text-sm font-display font-semibold text-text-primary">Operational Incidents Feed</h3>
            {alerts.length > 0 && (
              <button 
                onClick={handleDismissAll}
                className="text-xs text-text-muted hover:text-danger transition-colors font-medium"
              >
                Clear all active
              </button>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {alerts.length > 0 ? (
                alerts.map((alert) => {
                  const isRed = alert.severity === 'red';
                  const isAmber = alert.severity === 'amber';
                  const borderClass = isRed 
                    ? 'border-l-4 border-l-danger border-t border-r border-b border-border/40' 
                    : isAmber 
                      ? 'border-l-4 border-l-warning border-t border-r border-b border-border/40' 
                      : 'border-l-4 border-l-success border-t border-r border-b border-border/40';

                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className={`p-4 bg-surface/20 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:bg-surface/35 ${borderClass}`}>
                        <div className="flex gap-3 text-left">
                          <div className="mt-0.5 shrink-0">
                            {alert.severity === 'green' ? (
                              <CheckCircle2 className="h-5 w-5 text-success" />
                            ) : (
                              <AlertTriangle className={`h-5 w-5 ${isRed ? 'text-danger' : 'text-warning'}`} />
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display font-semibold text-sm text-text-primary">{alert.metric}</span>
                              <Badge variant={isRed ? 'danger' : isAmber ? 'warning' : 'success'} className="text-[9px] px-1.5">
                                {alert.severity === 'red' ? 'Critical' : alert.severity === 'amber' ? 'Warning' : 'Resolved'}
                              </Badge>
                              <span className="text-[10px] text-text-hint font-medium">• {alert.time}</span>
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed max-w-xl">{alert.description}</p>
                          </div>
                        </div>

                        {/* Actions block */}
                        <div className="flex items-center md:self-center gap-2 justify-end pt-2 md:pt-0 border-t border-border/20 md:border-none">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleCreateTicket(alert)}
                            className="text-xs gap-1 py-1 px-2.5 hover:bg-accent/10 hover:text-accent"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Ticket
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDismiss(alert.id)}
                            className="text-xs p-1 hover:bg-danger/10 hover:text-danger rounded-lg"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center space-y-3 bg-surface/10 border border-dashed border-border/40 rounded-xl"
                >
                  <CheckCircle2 className="h-10 w-10 text-success animate-pulse" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-text-primary">System is fully operational</h4>
                    <p className="text-xs text-text-muted">Zero active anomalies or threshold violations reported.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Alerts Configuration Panel */}
        <div className="lg:col-span-2">
          <Card className="bg-surface/30 border-border/60 sticky top-24 p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-border/40 pb-4">
              <Settings2 className="h-5 w-5 text-accent" />
              <div>
                <h3 className="text-sm font-display font-semibold text-text-primary">Alert Configuration</h3>
                <p className="text-[10px] text-text-muted">Adjust model sensitivity thresholds</p>
              </div>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-5 text-xs">
              {/* Threshold sensitivity */}
              <div className="space-y-2">
                <label className="text-text-muted font-medium flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-text-hint" />
                  IsolationForest Sensitivity
                </label>
                <div className="grid grid-cols-3 gap-2 bg-base p-1 border border-border rounded-lg">
                  {(['low', 'medium', 'high'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSensitivity(s)}
                      className={`py-1.5 rounded text-center font-medium capitalize transition-colors focus:outline-none ${
                        sensitivity === s 
                          ? 'bg-accent/10 text-accent border border-accent/20' 
                          : 'text-text-muted hover:text-text-primary border border-transparent'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-text-hint">
                  {sensitivity === 'low' && 'Contamination: 1%. Returns only extreme multi-metric deviations.'}
                  {sensitivity === 'medium' && 'Contamination: 5%. Balances system noise with actual deviations.'}
                  {sensitivity === 'high' && 'Contamination: 10%. Catches small outliers; increased false positives.'}
                </p>
              </div>

              {/* Custom Z-Score slider */}
              <div className="space-y-2">
                <div className="flex justify-between font-medium">
                  <span className="text-text-muted">Z-Score Trigger Distance</span>
                  <span className="text-accent font-semibold">{zScoreThreshold} σ</span>
                </div>
                <input 
                  type="range" 
                  min="1.5" 
                  max="4.0" 
                  step="0.1" 
                  value={zScoreThreshold}
                  onChange={(e) => setZScoreThreshold(parseFloat(e.target.value))}
                  className="w-full h-1 bg-raised rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <div className="flex justify-between text-[9px] text-text-hint font-display">
                  <span>1.5x σ (Sensitive)</span>
                  <span>4.0x σ (Extreme Only)</span>
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="space-y-3 pt-2 border-t border-border/40">
                <span className="text-text-muted font-medium block">Dispatch Integrations</span>
                
                {/* Email Dispatch */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="flex items-center gap-2 text-text-muted group-hover:text-text-primary transition-colors">
                    <Mail className="h-4 w-4 text-text-hint" />
                    Email Notifications
                  </span>
                  <input 
                    type="checkbox" 
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="rounded bg-base border-border text-accent focus:ring-accent focus:ring-opacity-25"
                  />
                </label>

                {/* Slack Dispatch */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="flex items-center gap-2 text-text-muted group-hover:text-text-primary transition-colors">
                    <svg className="h-4 w-4 fill-current text-text-hint" viewBox="0 0 24 24">
                      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.823 5.043a2.528 2.528 0 0 1 2.52-2.522 2.528 2.528 0 0 1 2.522 2.522v2.52h-2.522a2.528 2.528 0 0 1-2.52-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.78a2.528 2.528 0 0 1-2.522-2.522V8.824a2.528 2.528 0 0 1 2.522-2.52h5.043zm10.135 3.696a2.528 2.528 0 0 1 2.522-2.52 2.528 2.528 0 0 1 2.52 2.52v2.52h-2.52a2.528 2.528 0 0 1-2.522-2.52zm-1.262 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V3.78a2.528 2.528 0 0 1 2.522-2.522h5.043a2.528 2.528 0 0 1 2.52 2.522v5.043zm-3.781 10.135a2.528 2.528 0 0 1-2.52 2.522 2.528 2.528 0 0 1-2.522-2.522v-2.52h2.522a2.528 2.528 0 0 1 2.52 2.52zm0-1.262a2.528 2.528 0 0 1-2.52-2.52v-5.043a2.528 2.528 0 0 1 2.52-2.522h5.043c1.393 0 2.52 1.13 2.52 2.522v5.043a2.528 2.528 0 0 1-2.52 2.52h-5.043z"/>
                    </svg>
                    Slack Channel Integrations
                  </span>
                  <input 
                    type="checkbox" 
                    checked={slackAlerts}
                    onChange={(e) => setSlackAlerts(e.target.checked)}
                    className="rounded bg-base border-border text-accent focus:ring-accent focus:ring-opacity-25"
                  />
                </label>
              </div>

              {/* Webhook Endpoint Input */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <label className="text-text-muted font-medium flex items-center gap-1.5">
                  <Webhook className="h-3.5 w-3.5 text-text-hint" />
                  Webhook Target URL
                </label>
                <Input 
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="bg-base border-border/80 text-xs py-1.5"
                  placeholder="https://yourdomain.com/hooks"
                />
              </div>

              {/* Save settings Button */}
              <Button type="submit" variant="primary" className="w-full gap-1.5 py-2 font-semibold">
                Apply System Settings
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
