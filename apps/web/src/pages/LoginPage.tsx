import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Zap, Eye, EyeOff, Sparkles, Activity } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('admin@insightflow.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success('Successfully logged in!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      toast.error('Google login failed.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
      toast.success('Successfully logged in with Google!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Google authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-base text-text-primary selection:bg-accent/30 font-sans">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#111118',
          color: '#F1F0FF',
          border: '1px solid #1E1E2E',
        }
      }} />

      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface border-r border-border overflow-hidden flex-col justify-between p-12">
        {/* Animated Radial Glows */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-accent/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-900/5 blur-[100px]" />
        </div>

        {/* Top Header */}
        <div className="relative z-10 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="p-1.5 rounded-lg bg-accent/15 border border-accent/30 text-accent">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">InsightFlow</span>
        </div>

        {/* Center Promotion */}
        <div className="relative z-10 my-auto max-w-md space-y-6">
          <Badge variant="info" className="gap-1.5 px-3 py-1 bg-accent/10 border-accent/20 text-accent font-medium">
            <Sparkles className="h-3 w-3" />
            Decision Intelligence Platform
          </Badge>
          <h2 className="text-4xl font-display font-bold text-text-primary leading-tight">
            Analyze, forecast, and secure your metrics in seconds.
          </h2>
          <p className="text-text-muted leading-relaxed text-sm">
            Join thousands of analysts using InsightFlow to detect dataset anomalies, forecast revenues, and stream indicators directly inside a collaborative command center.
          </p>

          {/* Micro layout display */}
          <Card className="bg-base/40 border-border/40 p-4 rounded-xl flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-success/15 border border-success/30 text-success">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-xs font-display font-semibold text-text-primary">AI Anomaly Scanner Active</div>
              <div className="text-[10px] text-text-muted mt-0.5">Monitoring active database transactions...</div>
            </div>
            <span className="text-[10px] text-success font-display font-semibold px-2 py-0.5 bg-success/10 rounded-full border border-success/20">99.8%</span>
          </Card>
        </div>

        {/* Bottom footer */}
        <div className="relative z-10 text-xs text-text-hint">
          © {new Date().getFullYear()} InsightFlow Inc. All rights reserved.
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-10 right-10 z-10 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-accent hover:text-accent-hover font-semibold transition-colors">
            Register
          </Link>
        </div>

        <div className="max-w-sm w-full space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-display font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-text-muted">Enter your email to sign in to your dashboard</p>
          </div>

          {/* Demo Access Card */}
          <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/20 space-y-2 text-left">
            <div className="flex items-center gap-2 text-accent font-semibold text-xs">
              <Sparkles className="h-4 w-4" />
              <span>Demo Access</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              We've pre-filled the credentials below for your convenience. Click <strong>Sign in</strong> to access the dashboard instantly!
            </p>
            <div className="flex items-center justify-between text-[11px] font-mono bg-[#111118]/60 p-2 rounded-lg border border-border/40">
              <div>
                <span className="text-text-hint">Email:</span> <span className="text-text-primary">admin@insightflow.com</span>
              </div>
              <div>
                <span className="text-text-hint">PW:</span> <span className="text-text-primary">password123</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email Address"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-text-muted hover:text-text-primary focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center"
              isLoading={isSubmitting}
            >
              Sign in
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-full border-t border-border" />
            <span className="relative bg-base px-3 text-xs text-text-hint uppercase font-display font-medium">
              Or continue with
            </span>
          </div>

          {/* Google Login Component wrapper */}
          <div className="flex justify-center w-full">
            <div className="w-full border border-border rounded-lg overflow-hidden flex justify-center bg-surface hover:bg-raised transition-colors py-1">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google Sign In failed.')}
                theme="filled_black"
                shape="rectangular"
                width="340px"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
