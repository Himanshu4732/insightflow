import { motion } from 'framer-motion';
import { 
  Upload, 
  Brain, 
  TrendingUp, 
  MessageSquare, 
  BarChart3, 
  ShieldAlert, 
  Zap, 
  Check, 
  ArrowRight,
  Sparkles,
  Cpu,
  Activity,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#030307] text-text-primary overflow-x-hidden font-sans selection:bg-accent/30 selection:text-text-primary">
      
      {/* Premium Cybernetic Grid and Glowing AI Mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Cyber grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#131322_1px,transparent_1px),linear-gradient(to_bottom,#131322_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] opacity-75" />
        
        {/* Floating gradient energy orbs */}
        <div className="absolute top-[-10%] left-[10%] w-[60vw] h-[60vw] rounded-full bg-accent/8 blur-[130px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-purple-600/5 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-cyan-600/4 blur-[140px]" />
      </div>

      {/* 1. Navbar */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-[#030307]/80 backdrop-blur-md border-b border-white/[0.04] py-4' 
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="p-1.5 rounded-lg bg-accent/15 border border-accent/30 text-accent group-hover:bg-accent group-hover:text-[#030307] transition-all duration-300 shadow-[0_0_15px_rgba(124,111,247,0.2)]">
              <Zap className="h-5 w-5 fill-current animate-pulse" />
            </div>
            <span className="font-display font-semibold text-lg tracking-tight text-text-primary group-hover:text-accent transition-colors">
              InsightFlow
            </span>
          </div>

          {/* Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-muted">
            <a href="#features" className="hover:text-text-primary transition-colors hover:shadow-[0_0_8px_rgba(255,255,255,0.1)]">Features</a>
            <a href="#pricing" className="hover:text-text-primary transition-colors">Pricing</a>
            <a href="#docs" className="hover:text-text-primary transition-colors">Docs</a>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-text-muted hover:text-text-primary" onClick={() => navigate('/login')}>
              Log in
            </Button>
            <Button variant="primary" size="sm" className="shadow-lg shadow-accent/25 hover:shadow-accent/40" onClick={() => navigate('/register')}>
              Get started free
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-6 max-w-7xl mx-auto z-10 flex flex-col items-center text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-3xl flex flex-col items-center"
        >
          {/* AI Status Badge */}
          <motion.div variants={fadeInUp} className="mb-6">
            <Badge variant="info" className="gap-1.5 px-3.5 py-1 bg-accent/10 border-accent/25 text-accent font-medium font-mono uppercase tracking-wider text-[10px] shadow-[0_0_15px_rgba(124,111,247,0.1)]">
              <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '4s' }} />
              Autonomous Decision Engine v3.0
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            variants={fadeInUp}
            className="text-4xl sm:text-5xl md:text-6xl font-display font-bold tracking-tight text-text-primary leading-[1.15] mb-6"
          >
            Turn raw data sheets into <span className="bg-gradient-to-r from-accent via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(124,111,247,0.15)]">autonomous decisions</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            variants={fadeInUp}
            className="text-base sm:text-lg text-text-muted max-w-xl leading-relaxed mb-8 font-sans"
          >
            Upload any CSV spreadsheet. Let our neural intelligence pipeline automatically clean datatypes, scan for alerts, and output predictive models in seconds.
          </motion.p>

          {/* CTAs */}
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 mb-16 w-full sm:w-auto"
          >
            <Button variant="primary" size="lg" className="gap-2 group shadow-lg shadow-accent/20" onClick={() => navigate('/register')}>
              Launch Free Console <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="ghost" size="lg" className="border border-white/[0.08] hover:bg-white/[0.03] text-text-primary hover:text-accent transition-colors" onClick={() => navigate('/login')}>
              Instant Demo Access
            </Button>
          </motion.div>
        </motion.div>

        {/* High-Tech Dashboard Mockup (HTML/CSS-driven) */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-5xl rounded-2xl border border-white/[0.08] bg-[#07070c]/60 p-1.5 sm:p-2 backdrop-blur-xl shadow-2xl shadow-accent/15 relative group"
        >
          {/* Subtle glow border */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-accent/30 via-purple-500/20 to-cyan-500/30 opacity-40 blur-[8px] group-hover:opacity-75 transition-opacity duration-700 pointer-events-none -z-10" />
          
          <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-[#0a0a0f]/90 relative flex flex-col font-sans select-none text-left">
            {/* Top Command Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#0e0e16]/80 border-b border-white/[0.05] text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-success">AI Neural Engine Active</span>
                </div>
                <span className="text-[10px] text-text-hint font-mono bg-white/5 px-2 py-0.5 rounded border border-white/[0.03]">MODEL: PROPHET-V4.2</span>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-text-muted font-mono">
                <span className="flex items-center gap-1"><Cpu className="h-3 w-3 text-accent" /> CUDA Cores: 16,384</span>
                <span className="flex items-center gap-1"><Activity className="h-3 w-3 text-accent animate-pulse" /> Latency: 14ms</span>
              </div>
            </div>

            {/* Main Preview Grid */}
            <div className="grid md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/[0.05] bg-[#07070a]/90">
              
              {/* Sidebar Info */}
              <div className="p-4 space-y-4 md:col-span-1">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-text-hint">Loaded Dataset</div>
                  <div className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-accent" />
                    apple_finance_charts.csv
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/[0.05]">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-text-hint">Processing Statistics</div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Row Count:</span>
                      <span className="font-mono text-text-primary">50,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Columns:</span>
                      <span className="font-mono text-text-primary">12 inferred</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Anomalies:</span>
                      <span className="font-mono text-warning">3 flagged</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-accent/5 border border-accent/15 space-y-1.5">
                  <div className="text-[9px] uppercase font-mono tracking-wider text-accent font-semibold flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Autonomous Insights
                  </div>
                  <p className="text-[10px] text-text-muted leading-relaxed">
                    Volume deviation spotted in Q4 prediction interval. Suggests outlier demand spikes.
                  </p>
                </div>
              </div>

              {/* Central Chart View (2 columns) */}
              <div className="p-4 md:col-span-2 space-y-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-primary font-display">TimeSeries Predictive Path</span>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Historical</span>
                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-purple-400" /> Forecast</span>
                  </div>
                </div>

                {/* Styled CSS/SVG Chart */}
                <div className="h-44 w-full relative flex items-end">
                  <svg className="w-full h-full text-accent opacity-90 overflow-visible" viewBox="0 0 400 150">
                    <defs>
                      <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M 0 130 Q 50 110 100 120 T 200 90 T 300 70 T 400 30" fill="url(#chartGlow)" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 280 74 Q 340 50 400 20" fill="none" stroke="#A78BFA" strokeWidth="2.5" strokeDasharray="4 3" strokeLinecap="round" />
                    <circle cx="280" cy="74" r="4" fill="var(--accent)" />
                    <circle cx="400" cy="20" r="4" fill="#A78BFA" />
                  </svg>
                  {/* Floating tooltip */}
                  <div className="absolute top-4 right-10 bg-[#0f0f18] border border-white/[0.08] p-2 rounded-lg text-[9px] shadow-lg pointer-events-none">
                    <div className="text-text-hint">Dec 2026 Prediction</div>
                    <div className="font-bold text-accent mt-0.5">$184.22 ± 4.5%</div>
                  </div>
                </div>

                {/* Timeline Axis */}
                <div className="flex justify-between text-[9px] text-text-hint font-mono border-t border-white/[0.05] pt-2">
                  <span>JAN 2025</span>
                  <span>JUL 2025</span>
                  <span>JAN 2026</span>
                  <span>JUL 2026</span>
                  <span>DEC 2026 (F)</span>
                </div>
              </div>

              {/* Right Sidebar - Anomalies Feed & Scanner */}
              <div className="p-4 space-y-4 md:col-span-1">
                <div className="text-[10px] uppercase font-mono tracking-wider text-text-hint">Live Anomaly Scanner</div>
                <div className="space-y-2.5">
                  <div className="p-2 bg-danger/5 border border-danger/20 rounded-lg flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 text-danger font-medium">
                      <ShieldAlert className="h-3 w-3 shrink-0" />
                      <span>Volatility Shift</span>
                    </div>
                    <span className="text-[9px] text-text-hint font-mono">0.02ms</span>
                  </div>
                  <div className="p-2 bg-warning/5 border border-warning/20 rounded-lg flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 text-warning font-medium">
                      <ShieldAlert className="h-3 w-3 shrink-0" />
                      <span>Pattern Outlier</span>
                    </div>
                    <span className="text-[9px] text-text-hint font-mono">1.4ms</span>
                  </div>
                  <div className="p-2 bg-success/5 border border-success/20 rounded-lg flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 text-success font-medium">
                      <Check className="h-3 w-3 shrink-0" />
                      <span>Normal Ingestion</span>
                    </div>
                    <span className="text-[9px] text-text-hint font-mono">Just now</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 3. Logos Strip */}
      <section className="border-t border-b border-white/[0.04] bg-[#07070c]/40 py-10 px-6 z-10 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-xs font-mono font-medium uppercase tracking-widest text-text-hint">
            Trusted by teams at —
          </span>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12">
            {['Acme Corp', 'Stripe', 'Linear', 'Vercel', 'Supabase'].map((company, index) => (
              <div 
                key={index} 
                className="px-4 py-2 rounded-lg border border-white/[0.06] bg-white/[0.01] backdrop-blur-sm text-sm font-semibold font-display text-text-muted hover:text-text-primary hover:border-accent/30 hover:bg-white/[0.03] transition-all duration-300"
              >
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Features Grid */}
      <section id="features" className="py-24 md:py-32 px-6 max-w-7xl mx-auto z-10 relative scroll-mt-20">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <motion.div variants={fadeInUp} className="mb-4">
            <Badge variant="info" className="font-mono text-[10px] tracking-wider uppercase bg-accent/10 border-accent/20 text-accent">Platform Capabilities</Badge>
          </motion.div>
          <motion.h2 
            variants={fadeInUp}
            className="text-3xl sm:text-4xl font-display font-semibold mb-4 text-text-primary"
          >
            Smarter ingestion. Real-time inference.
          </motion.h2>
          <motion.p 
            variants={fadeInUp}
            className="text-text-muted text-base sm:text-lg max-w-2xl mx-auto"
          >
            Our microservices automatically map dataset schemas, calculate vector deviations, and output reliable future trends.
          </motion.p>
        </motion.div>

        {/* Features List (2x3 Grid) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {[
            {
              icon: Upload,
              title: "Neural ingestion layer",
              desc: "Drag and drop any spreadsheet. Our parser dynamically reads type representations, handles empty cells, and builds database indexes."
            },
            {
              icon: Brain,
              title: "Autonomous anomalies",
              desc: "Constantly monitors metric patterns. Automatically alerts on transaction spike shifts and server-side deadlock latencies."
            },
            {
              icon: TrendingUp,
              title: "Predictive forecasting",
              desc: "Calculate high-precision future curves. Utilizes robust time-series mathematical models with configurable confidence ranges."
            },
            {
              icon: MessageSquare,
              title: "Natural Query Assistant",
              desc: "Interact with dataset rows via query bars. Ask direct numerical questions and visualize outcomes instantly."
            },
            {
              icon: BarChart3,
              title: "High-Fidelity Explorer",
              desc: "Filter, sort, and slice thousands of spreadsheet rows. Click column headers to calculate descriptive parameters instantly."
            },
            {
              icon: ShieldAlert,
              title: "Enterprise Grade Guardrails",
              desc: "Built-in encryption layers, cookie-based token refreshes, and database transactions for all workspace updates."
            }
          ].map((feature, i) => (
            <motion.div 
              key={i} 
              variants={fadeInUp}
              className="group h-[210px]"
            >
              <Card 
                hoverEffect 
                className="h-full bg-[#0a0a0f]/40 border-white/[0.04] hover:border-accent/40 hover:bg-[#0f0f18]/60 group-hover:shadow-[0_0_30px_rgba(124,111,247,0.08)] flex flex-col justify-between transition-all duration-300 backdrop-blur-md"
              >
                <div>
                  <div className="p-2 w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 text-accent group-hover:bg-accent group-hover:text-[#030307] transition-all duration-300 flex items-center justify-center mb-4">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-semibold text-text-primary mb-2 text-base group-hover:text-accent transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 5. Pricing Section */}
      <section id="pricing" className="py-24 md:py-32 bg-[#05050a]/40 border-t border-white/[0.04] z-10 relative scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <motion.div variants={fadeInUp} className="mb-4">
              <Badge variant="info" className="font-mono text-[10px] tracking-wider uppercase bg-accent/10 border-accent/20 text-accent">Pricing Tiers</Badge>
            </motion.div>
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-display font-semibold mb-4 text-text-primary"
            >
              Simple models, flexible scales
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-text-muted text-base sm:text-lg max-w-2xl mx-auto"
            >
              Start analyzing with our free console, or upgrade to a dedicated enterprise pipeline.
            </motion.p>
          </motion.div>

          {/* Pricing Cards (3 Cards) */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto"
          >
            {/* Starter Plan */}
            <motion.div variants={fadeInUp} className="h-[460px]">
              <Card className="h-full bg-[#0a0a0f]/40 border-white/[0.05] hover:border-white/[0.1] transition-all duration-300 flex flex-col justify-between p-8 backdrop-blur-md">
                <div>
                  <h3 className="font-mono text-[#6B6B8A] text-xs mb-2 uppercase tracking-widest">Starter</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-display font-bold text-text-primary">Free</span>
                  </div>
                  <p className="text-xs text-text-muted mb-6 leading-relaxed">Perfect for exploring basic data insights, standard dashboard widgets, and demo testing.</p>
                  
                  <hr className="border-white/[0.05] my-6" />
                  
                  <ul className="space-y-3.5 text-sm text-text-muted">
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-accent shrink-0" />
                      <span>3 uploaded datasets</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-accent shrink-0" />
                      <span>Basic reporting charts</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-accent shrink-0" />
                      <span>24-hour support SLA</span>
                    </li>
                  </ul>
                </div>
                <Button variant="secondary" className="w-full mt-6 border border-white/[0.08] hover:bg-white/[0.03]" onClick={() => navigate('/register')}>Get started</Button>
              </Card>
            </motion.div>

            {/* Pro Plan (Highlighted with Neon Glow) */}
            <motion.div variants={fadeInUp} className="h-[460px] relative group/price">
              <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-accent via-purple-500 to-cyan-500 opacity-35 blur-[3px] group-hover:opacity-60 transition-opacity -z-10" />
              <Card className="h-full bg-[#08080f] border-accent/80 hover:border-accent relative z-10 shadow-2xl shadow-accent/5 flex flex-col justify-between p-8 transform scale-[1.02] md:-translate-y-1 transition-all duration-300">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-mono font-semibold text-accent text-xs uppercase tracking-widest">Pro</h3>
                    <Badge variant="info" className="bg-accent/15 border-accent/30 text-accent font-semibold px-2.5 py-0.5 text-[9px] uppercase tracking-wider">RECOMMENDED</Badge>
                  </div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-display font-bold text-text-primary">$29</span>
                    <span className="text-text-muted text-sm font-sans">/mo</span>
                  </div>
                  <p className="text-xs text-text-muted mb-6 leading-relaxed">Advanced inference for growing teams needing anomaly triggers, vector graphs, and forecasts.</p>
                  
                  <hr className="border-white/[0.05] my-6" />
                  
                  <ul className="space-y-3.5 text-sm text-text-primary">
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-accent shrink-0" />
                      <span>Unlimited datasets</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-accent shrink-0" />
                      <span>Advanced AI anomalies</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-accent shrink-0" />
                      <span>Demand forecasting models</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-accent shrink-0" />
                      <span>Priority support response</span>
                    </li>
                  </ul>
                </div>
                <Button variant="primary" className="w-full mt-6 shadow-md shadow-accent/25" onClick={() => navigate('/register')}>Get started Pro</Button>
              </Card>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div variants={fadeInUp} className="h-[460px]">
              <Card className="h-full bg-[#0a0a0f]/40 border-white/[0.05] hover:border-white/[0.1] transition-all duration-300 flex flex-col justify-between p-8 backdrop-blur-md">
                <div>
                  <h3 className="font-mono text-[#6B6B8A] text-xs mb-2 uppercase tracking-widest">Enterprise</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-display font-bold text-text-primary">Custom</span>
                  </div>
                  <p className="text-xs text-text-muted mb-6 leading-relaxed">Ultimate security, dedicated compute slots, custom SLA, and white labeling.</p>
                  
                  <hr className="border-white/[0.05] my-6" />
                  
                  <ul className="space-y-3.5 text-sm text-text-muted">
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-accent shrink-0" />
                      <span>White-label visualizer</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-accent shrink-0" />
                      <span>SSO/SAML integration</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-accent shrink-0" />
                      <span>Custom dedicated server</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-accent shrink-0" />
                      <span>99.9% uptime SLA</span>
                    </li>
                  </ul>
                </div>
                <Button variant="secondary" className="w-full mt-6 border border-white/[0.08] hover:bg-white/[0.03]" onClick={() => navigate('/register')}>Contact sales</Button>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="border-t border-white/[0.04] bg-[#050508] pt-16 pb-8 px-6 z-10 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
            {/* Tagline Column */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-accent/15 text-accent border border-accent/25">
                  <Zap className="h-4 w-4 fill-current" />
                </div>
                <span className="font-display font-semibold text-text-primary">InsightFlow</span>
              </div>
              <p className="text-sm text-text-muted max-w-xs leading-relaxed">
                Empowering modern decision makers to extract predictive intelligence from unstructured tables instantly.
              </p>
            </div>

            {/* Links Columns */}
            <div>
              <h4 className="text-xs font-mono font-semibold text-text-primary uppercase tracking-widest mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-text-muted font-sans">
                <li><a href="#features" className="hover:text-text-primary transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-text-primary transition-colors">Pricing</a></li>
                <li><a href="#docs" className="hover:text-text-primary transition-colors">API Docs</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-mono font-semibold text-text-primary uppercase tracking-widest mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-text-muted font-sans">
                <li><a href="#about" className="hover:text-text-primary transition-colors">About Us</a></li>
                <li><a href="#careers" className="hover:text-text-primary transition-colors">Careers</a></li>
                <li><a href="#blog" className="hover:text-text-primary transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-mono font-semibold text-text-primary uppercase tracking-widest mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-text-muted font-sans">
                <li><a href="#privacy" className="hover:text-text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#terms" className="hover:text-text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#security" className="hover:text-text-primary transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom line */}
          <div className="border-t border-white/[0.04] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-hint font-mono">
            <span>© {new Date().getFullYear()} InsightFlow Inc. All rights reserved.</span>
            <span className="flex items-center gap-1">
              Built with love in India 🇮🇳
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
