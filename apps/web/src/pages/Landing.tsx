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
  Sparkles
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
    <div className="relative min-h-screen bg-base text-text-primary overflow-x-hidden font-sans selection:bg-accent/30 selection:text-text-primary">
      {/* Subtle Animated Radial Gradient Mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] rounded-full bg-purple-900/5 blur-[100px]" />
      </div>

      {/* 1. Navbar */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-base/70 backdrop-blur-md border-b border-border/80 py-4' 
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="p-1.5 rounded-lg bg-accent/15 border border-accent/30 text-accent group-hover:bg-accent group-hover:text-text-primary transition-all duration-300">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <span className="font-display font-semibold text-lg tracking-tight text-text-primary group-hover:text-accent transition-colors">
              InsightFlow
            </span>
          </div>

          {/* Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-muted">
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#pricing" className="hover:text-text-primary transition-colors">Pricing</a>
            <a href="#docs" className="hover:text-text-primary transition-colors">Docs</a>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-text-muted hover:text-text-primary" onClick={() => navigate('/login')}>
              Log in
            </Button>
            <Button variant="primary" size="sm" className="shadow-lg hover:shadow-accent/40" onClick={() => navigate('/register')}>
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
          {/* Badge */}
          <motion.div variants={fadeInUp} className="mb-6">
            <Badge variant="info" className="gap-1.5 px-3 py-1 bg-accent/10 border-accent/20 text-accent font-medium">
              <Sparkles className="h-3 w-3" />
              InsightFlow AI v2.0 is live
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            variants={fadeInUp}
            className="text-4xl sm:text-5xl md:text-6xl font-display font-semibold tracking-tight text-text-primary leading-[1.1] mb-6"
          >
            Turn raw data into <span className="bg-gradient-to-r from-accent via-[#A78BFA] to-[#C084FC] bg-clip-text text-transparent">real decisions</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            variants={fadeInUp}
            className="text-base sm:text-lg text-text-muted max-w-xl leading-relaxed mb-8"
          >
            Upload your CSV. Get AI dashboards, anomaly alerts, 
            and forecasting — in under 60 seconds.
          </motion.p>

          {/* CTAs */}
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 mb-16 w-full sm:w-auto"
          >
            <Button variant="primary" size="lg" className="gap-2 group" onClick={() => navigate('/register')}>
              Start for free <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="ghost" size="lg" className="border border-border hover:bg-surface/50" onClick={() => navigate('/login')}>
              View demo
            </Button>
          </motion.div>
        </motion.div>

        {/* Mock Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-5xl rounded-2xl border border-border/80 bg-surface/40 p-2 sm:p-3 backdrop-blur-xl shadow-2xl shadow-accent/5 relative group"
        >
          {/* Subtle glow border */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <div className="rounded-xl border border-border/40 overflow-hidden bg-base/80 aspect-[16/10] relative">
            {/* Inline SVG Mockup */}
            <svg viewBox="0 0 960 600" className="w-full h-full text-text-muted select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Sidebar */}
              <rect x="0" y="0" width="70" height="600" fill="#111118" />
              <line x1="70" y1="0" x2="70" y2="600" stroke="#1E1E2E" />
              
              {/* Sidebar Icons Mock */}
              <circle cx="35" cy="35" r="10" fill="#7C6FF7" fillOpacity="0.2" stroke="#7C6FF7" strokeWidth="1.5" />
              <path d="M30 35H40M35 30V40" stroke="#7C6FF7" strokeWidth="1.5" strokeLinecap="round" />
              
              <rect x="25" y="80" width="20" height="20" rx="4" fill="#16161F" stroke="#1E1E2E" />
              <rect x="25" y="120" width="20" height="20" rx="4" fill="#16161F" stroke="#1E1E2E" />
              <rect x="25" y="160" width="20" height="20" rx="4" fill="#16161F" stroke="#1E1E2E" />
              <rect x="25" y="200" width="20" height="20" rx="4" fill="#16161F" stroke="#1E1E2E" />
              
              {/* Header */}
              <rect x="70" y="0" width="890" height="60" fill="#111118" />
              <line x1="70" y1="60" x2="960" y2="60" stroke="#1E1E2E" />
              <text x="95" y="37" fill="#F1F0FF" fontFamily="Sora" fontWeight="600" fontSize="14">Workspace / Analytics</text>
              
              <rect x="760" y="15" width="120" height="30" rx="6" fill="#16161F" stroke="#1E1E2E" />
              <circle cx="910" cy="30" r="12" fill="#7C6FF7" />
              <text x="906" y="34" fill="#F1F0FF" fontFamily="DM Sans" fontWeight="600" fontSize="10">U</text>

              {/* Main Content Dashboard */}
              {/* KPI Cards */}
              {/* Card 1 */}
              <rect x="95" y="90" width="235" height="90" rx="10" fill="#111118" stroke="#1E1E2E" />
              <text x="115" y="125" fill="#6B6B8A" fontFamily="DM Sans" fontSize="12">Total Datasets Analyzed</text>
              <text x="115" y="157" fill="#F1F0FF" fontFamily="Sora" fontWeight="600" fontSize="24">1,482</text>
              <rect x="260" y="137" width="50" height="20" rx="10" fill="#22C55E" fillOpacity="0.1" />
              <text x="270" y="151" fill="#22C55E" fontFamily="DM Sans" fontWeight="600" fontSize="10">+12%</text>

              {/* Card 2 */}
              <rect x="362" y="90" width="235" height="90" rx="10" fill="#111118" stroke="#1E1E2E" />
              <text x="382" y="125" fill="#6B6B8A" fontFamily="DM Sans" fontSize="12">Active Anomaly Alerts</text>
              <text x="382" y="157" fill="#EF4444" fontFamily="Sora" fontWeight="600" fontSize="24">3</text>
              <rect x="527" y="137" width="50" height="20" rx="10" fill="#EF4444" fillOpacity="0.1" />
              <text x="536" y="151" fill="#EF4444" fontFamily="DM Sans" fontWeight="600" fontSize="10">Critical</text>

              {/* Card 3 */}
              <rect x="630" y="90" width="235" height="90" rx="10" fill="#111118" stroke="#1E1E2E" />
              <text x="650" y="125" fill="#6B6B8A" fontFamily="DM Sans" fontSize="12">Avg. Insight Score</text>
              <text x="650" y="157" fill="#F1F0FF" fontFamily="Sora" fontWeight="600" fontSize="24">94.8%</text>
              <rect x="795" y="137" width="50" height="20" rx="10" fill="#7C6FF7" fillOpacity="0.1" />
              <text x="806" y="151" fill="#7C6FF7" fontFamily="DM Sans" fontWeight="600" fontSize="10">Superb</text>

              {/* Big Chart Card */}
              <rect x="95" y="210" width="770" height="350" rx="12" fill="#111118" stroke="#1E1E2E" />
              <text x="120" y="245" fill="#F1F0FF" fontFamily="Sora" fontWeight="600" fontSize="14">AI Revenue & Demand Forecasting</text>
              <text x="120" y="265" fill="#6B6B8A" fontFamily="DM Sans" fontSize="11">Real-time prediction vs historical performance</text>

              {/* Grid Lines */}
              <line x1="120" y1="310" x2="840" y2="310" stroke="#1E1E2E" strokeDasharray="3 3" />
              <line x1="120" y1="370" x2="840" y2="370" stroke="#1E1E2E" strokeDasharray="3 3" />
              <line x1="120" y1="430" x2="840" y2="430" stroke="#1E1E2E" strokeDasharray="3 3" />
              <line x1="120" y1="490" x2="840" y2="490" stroke="#1E1E2E" />

              {/* Chart Lines (Historical - Solid Violet) */}
              <path d="M120 480 Q180 430 240 450 T360 380 T480 390 T600 320 T720 340 T840 280" fill="none" stroke="#7C6FF7" strokeWidth="3" strokeLinecap="round" />
              
              {/* Chart Lines (Forecast - Dotted Purple/Violet glow) */}
              <path d="M600 320 Q660 280 720 260 T840 210" fill="none" stroke="#A78BFA" strokeWidth="2.5" strokeDasharray="6 4" strokeLinecap="round" />
              
              {/* Glow filter area representation */}
              <circle cx="600" cy="320" r="5" fill="#7C6FF7" />
              <circle cx="840" cy="210" r="5" fill="#A78BFA" />

              {/* Legend */}
              <rect x="700" y="235" width="8" height="8" rx="2" fill="#7C6FF7" />
              <text x="715" y="243" fill="#6B6B8A" fontFamily="DM Sans" fontSize="11">Historical</text>
              
              <rect x="780" y="235" width="8" height="8" rx="2" fill="#A78BFA" />
              <text x="795" y="243" fill="#6B6B8A" fontFamily="DM Sans" fontSize="11">Forecast</text>
            </svg>
          </div>
        </motion.div>
      </section>

      {/* 3. Logos Strip */}
      <section className="border-t border-b border-border/40 bg-surface/20 py-10 px-6 z-10 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-xs font-display font-medium uppercase tracking-wider text-text-hint">
            Trusted by teams at —
          </span>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12">
            {['Acme Corp', 'Stripe', 'Linear', 'Vercel', 'Supabase'].map((company, index) => (
              <div 
                key={index} 
                className="px-4 py-2 rounded-lg border border-border/30 bg-surface/40 backdrop-blur-sm text-sm font-semibold font-display text-text-muted hover:text-text-primary hover:border-border transition-colors duration-200"
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
            <Badge variant="info">Platform Features</Badge>
          </motion.div>
          <motion.h2 
            variants={fadeInUp}
            className="text-3xl sm:text-4xl font-display font-semibold mb-4 text-text-primary"
          >
            Everything you need to analyze, forecast, and act
          </motion.h2>
          <motion.p 
            variants={fadeInUp}
            className="text-text-muted text-base sm:text-lg max-w-2xl mx-auto"
          >
            Powerful cloud infrastructure, lightning-fast processing, and state-of-the-art ML modeling combined into one dashboard.
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
              title: "Smart data ingestion",
              desc: "Drag and drop any CSV. Our engine parses datatypes, structures columns, and sanitizes values automatically."
            },
            {
              icon: Brain,
              title: "AI anomaly detection",
              desc: "Identify outliers, shifts, and patterns. Receive instant notifications before anomalies affect business KPIs."
            },
            {
              icon: TrendingUp,
              title: "Time-series forecasting",
              desc: "Forecast trends, demand levels, and revenue up to 12 months ahead with custom-tailored statistical ML models."
            },
            {
              icon: MessageSquare,
              title: "NL query engine",
              desc: "Query your data in plain English. Ask 'Why did sales drop last Tuesday?' and receive structured visual graphs."
            },
            {
              icon: BarChart3,
              title: "Real-time dashboards",
              desc: "Configure customized drag-and-drop metrics, widget types, and auto-updating reporting alerts."
            },
            {
              icon: ShieldAlert,
              title: "Role-based access",
              desc: "Scale security with SSO, MFA, granular dashboard viewer permissions, and end-to-end dataset encryption."
            }
          ].map((feature, i) => (
            <motion.div 
              key={i} 
              variants={fadeInUp}
              className="group h-[200px]" // Static height prevents layout shift
            >
              <Card 
                hoverEffect 
                className="h-full bg-white/[0.03] border-white/[0.08] hover:border-accent/40 group-hover:shadow-[0_0_20px_rgba(124,111,247,0.06)] flex flex-col justify-between"
              >
                <div>
                  <div className="p-2 w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 text-accent group-hover:bg-accent group-hover:text-text-primary transition-all duration-300 flex items-center justify-center mb-4">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-medium text-text-primary mb-2 text-base group-hover:text-accent transition-colors">
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
      <section id="pricing" className="py-24 md:py-32 bg-surface/10 border-t border-border/30 z-10 relative scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <motion.div variants={fadeInUp} className="mb-4">
              <Badge variant="info">Simple Pricing</Badge>
            </motion.div>
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-display font-semibold mb-4 text-text-primary"
            >
              Honest pricing, no hidden limits
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-text-muted text-base sm:text-lg max-w-2xl mx-auto"
            >
              Start for free, upgrade when your team grows. All plans include automated data backup and basic charting options.
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
              <Card className="h-full bg-white/[0.02] border-white/[0.08] hover:border-border-hover transition-all flex flex-col justify-between p-8">
                <div>
                  <h3 className="font-display font-medium text-text-muted text-sm mb-2 uppercase tracking-wide">Starter</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-display font-semibold text-text-primary">Free</span>
                  </div>
                  <p className="text-xs text-text-muted mb-6 leading-relaxed">Perfect for individuals checking out basic data insights and simple visualizations.</p>
                  
                  <hr className="border-border/50 my-6" />
                  
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
                <Button variant="secondary" className="w-full mt-6" onClick={() => navigate('/register')}>Get started</Button>
              </Card>
            </motion.div>

            {/* Pro Plan (Highlighted) */}
            <motion.div variants={fadeInUp} className="h-[460px] relative">
              <div className="absolute inset-0 bg-accent/20 blur-xl opacity-20 pointer-events-none rounded-2xl" />
              <Card className="h-full bg-surface border-accent hover:border-accent-hover relative z-10 shadow-xl shadow-accent/5 flex flex-col justify-between p-8 transform scale-[1.02] md:-translate-y-1">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-semibold text-accent text-sm uppercase tracking-wide">Pro</h3>
                    <Badge variant="info" className="bg-accent/15 border-accent/30 text-accent font-medium px-2.5 py-0.5">MOST POPULAR</Badge>
                  </div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-display font-semibold text-text-primary">$29</span>
                    <span className="text-text-muted text-sm font-sans">/mo</span>
                  </div>
                  <p className="text-xs text-text-muted mb-6 leading-relaxed">Advanced tools for scaling teams needing continuous metrics, anomaly warnings, and predictions.</p>
                  
                  <hr className="border-border/50 my-6" />
                  
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
                <Button variant="primary" className="w-full mt-6" onClick={() => navigate('/register')}>Get started Pro</Button>
              </Card>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div variants={fadeInUp} className="h-[460px]">
              <Card className="h-full bg-white/[0.02] border-white/[0.08] hover:border-border-hover transition-all flex flex-col justify-between p-8">
                <div>
                  <h3 className="font-display font-medium text-text-muted text-sm mb-2 uppercase tracking-wide">Enterprise</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-display font-semibold text-text-primary">Custom</span>
                  </div>
                  <p className="text-xs text-text-muted mb-6 leading-relaxed">Ultimate security, dedicated infrastructure, SLA response assurances, and white labeling.</p>
                  
                  <hr className="border-border/50 my-6" />
                  
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
                <Button variant="secondary" className="w-full mt-6" onClick={() => navigate('/register')}>Contact sales</Button>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="border-t border-border/40 bg-surface/30 pt-16 pb-8 px-6 z-10 relative">
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
                Empowering modern product development teams to interpret unstructured numbers instantly.
              </p>
            </div>

            {/* Links Columns */}
            <div>
              <h4 className="text-xs font-display font-semibold text-text-primary uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-text-muted">
                <li><a href="#features" className="hover:text-text-primary transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-text-primary transition-colors">Pricing</a></li>
                <li><a href="#docs" className="hover:text-text-primary transition-colors">API Docs</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-display font-semibold text-text-primary uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-text-muted">
                <li><a href="#about" className="hover:text-text-primary transition-colors">About Us</a></li>
                <li><a href="#careers" className="hover:text-text-primary transition-colors">Careers</a></li>
                <li><a href="#blog" className="hover:text-text-primary transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-display font-semibold text-text-primary uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-text-muted">
                <li><a href="#privacy" className="hover:text-text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#terms" className="hover:text-text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#security" className="hover:text-text-primary transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom line */}
          <div className="border-t border-border/40 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-hint">
            <span>© {new Date().getFullYear()} InsightFlow Inc. All rights reserved.</span>
            <span className="flex items-center gap-1 font-display">
              Built with love in India 🇮🇳
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
