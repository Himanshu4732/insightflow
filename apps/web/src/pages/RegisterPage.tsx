import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Zap, Eye, EyeOff, Sparkles, CheckSquare, Square } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password strength state
  const [strengthLevel, setStrengthLevel] = useState(0);
  const [strengthLabel, setStrengthLabel] = useState('');
  const [strengthColor, setStrengthColor] = useState('bg-danger');

  useEffect(() => {
    if (!password) {
      setStrengthLevel(0);
      setStrengthLabel('');
      return;
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    setStrengthLevel(score);

    switch (score) {
      case 1:
        setStrengthLabel('Weak');
        setStrengthColor('bg-danger');
        break;
      case 2:
        setStrengthLabel('Fair');
        setStrengthColor('bg-warning');
        break;
      case 3:
        setStrengthLabel('Good');
        setStrengthColor('bg-amber-400');
        break;
      case 4:
        setStrengthLabel('Strong');
        setStrengthColor('bg-success');
        break;
      default:
        setStrengthLabel('Very Weak');
        setStrengthColor('bg-danger');
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    if (!acceptTerms) {
      toast.error('Please accept the terms and conditions.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, name, password);
      toast.success('Account created successfully!');
      navigate('/onboarding');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed.');
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
      toast.success('Successfully registered with Google!');
      navigate('/onboarding');
    } catch (err: any) {
      toast.error(err.message || 'Google registration failed.');
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
            Empower Your Operations
          </Badge>
          <h2 className="text-4xl font-display font-bold text-text-primary leading-tight">
            The modern analytical workspace starts here.
          </h2>
          <p className="text-text-muted leading-relaxed text-sm">
            Create an account to gain access to drag-and-drop CSV analytics, high-accuracy statistical forecasting models, and customizable reporting dashboards.
          </p>
        </div>

        {/* Bottom footer */}
        <div className="relative z-10 text-xs text-text-hint">
          © {new Date().getFullYear()} InsightFlow Inc. All rights reserved.
        </div>
      </div>

      {/* Right Register Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="absolute top-10 right-10 z-10 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:text-accent-hover font-semibold transition-colors">
            Sign in
          </Link>
        </div>

        <div className="max-w-sm w-full space-y-6 py-12">
          <div className="space-y-2">
            <h1 className="text-3xl font-display font-semibold tracking-tight">Create your account</h1>
            <p className="text-sm text-text-muted">Start analyzing your datasets in under 60 seconds.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              label="Full Name"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />

            <Input
              type="email"
              label="Email Address"
              placeholder="jane@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Choose a strong password"
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

            {/* Password strength visualizer */}
            {password && (
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between text-[10px] font-display font-medium text-text-muted">
                  <span>Password strength</span>
                  <span className="font-semibold text-text-primary">{strengthLabel}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-full rounded-full transition-all duration-300 ${
                        level <= strengthLevel ? strengthColor : 'bg-raised'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Confirm Password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Terms checkbox */}
            <div 
              className="flex items-start gap-2.5 text-left py-1 cursor-pointer select-none"
              onClick={() => setAcceptTerms(!acceptTerms)}
            >
              <div className="text-accent mt-0.5 shrink-0">
                {acceptTerms ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-border" />}
              </div>
              <span className="text-xs text-text-muted leading-tight">
                I agree to the{' '}
                <a href="#terms" className="text-text-primary hover:underline" onClick={(e) => e.stopPropagation()}>Terms of Service</a>
                {' '}and{' '}
                <a href="#privacy" className="text-text-primary hover:underline" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>.
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center mt-2"
              isLoading={isSubmitting}
            >
              Get started free
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-full border-t border-border" />
            <span className="relative bg-base px-3 text-xs text-text-hint uppercase font-display font-medium">
              Or register with
            </span>
          </div>

          {/* Google Login Component wrapper */}
          <div className="flex justify-center w-full">
            <div className="w-full border border-border rounded-lg overflow-hidden flex justify-center bg-surface hover:bg-raised transition-colors py-1">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google registration failed.')}
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
