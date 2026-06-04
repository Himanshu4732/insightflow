import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockDatasets } from '../data/mockDashboard';
import toast from 'react-hot-toast';
import { 
  Zap, 
  LayoutDashboard, 
  Table, 
  MessageSquare, 
  TrendingUp, 
  Bell, 
  Settings, 
  LogOut,
  ChevronDown,
  Calendar,
  Search,
  User as UserIcon
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface AppLayoutProps {
  children: React.ReactNode;
  isWsConnected?: boolean;
}

export default function AppLayout({ children, isWsConnected = false }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const [activeDataset, setActiveDataset] = useState(mockDatasets[0].id);
  const [activeDateRange, setActiveDateRange] = useState('30d');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Data Explorer', path: '/explorer', icon: Table },
    { name: 'Ask AI', path: '/ask', icon: MessageSquare },
    { name: 'Forecasting', path: '/forecasting', icon: TrendingUp },
    { name: 'Alerts', path: '/alerts', icon: Bell, badgeCount: 4 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getBreadcrumb = () => {
    const item = menuItems.find(i => i.path === location.pathname);
    return item ? item.name : 'Dashboard';
  };

  const currentDatasetName = mockDatasets.find(d => d.id === activeDataset)?.name || 'Select Dataset';

  return (
    <div className="min-h-screen bg-base text-text-primary flex font-sans">
      {/* Sidebar - Fixed (240px) */}
      <aside className="w-[240px] bg-surface border-r border-border fixed top-0 bottom-0 left-0 z-30 flex flex-col justify-between p-6">
        <div className="space-y-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-1.5 rounded-lg bg-accent/15 border border-accent/30 text-accent group-hover:bg-accent group-hover:text-text-primary transition-all duration-300">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <span className="font-display font-semibold text-lg tracking-tight text-text-primary group-hover:text-accent transition-colors">
              InsightFlow
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                    isActive 
                      ? 'bg-accent/10 text-accent font-semibold' 
                      : 'text-text-muted hover:text-text-primary hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Left violet border on active */}
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-accent rounded-r-md" />
                  )}

                  <div className="flex items-center gap-3">
                    <Icon className={`h-4.5 w-4.5 transition-colors ${
                      isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-primary'
                    }`} />
                    <span>{item.name}</span>
                  </div>

                  {item.badgeCount && (
                    <span className="bg-danger text-text-primary text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {item.badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Panel: User Profile */}
        <div className="border-t border-border/60 pt-6 space-y-4">
          <div className="flex items-center gap-3">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="w-9 h-9 rounded-full border border-border" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-accent/25 border border-accent/20 flex items-center justify-center text-accent text-sm font-semibold font-display">
                {user?.name ? user.name[0].toUpperCase() : <UserIcon className="h-4.5 w-4.5" />}
              </div>
            )}
            <div className="min-w-0 flex-1 text-left">
              <div className="text-xs font-semibold text-text-primary truncate">{user?.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="info" className="text-[9px] px-1.5 py-0 bg-accent/10 border-accent/20 text-accent uppercase font-semibold">Pro Plan</Badge>
              </div>
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="w-full justify-start gap-2.5 text-text-muted hover:text-danger hover:bg-danger/10 px-3 py-2 text-xs"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 pl-[240px] flex flex-col min-h-screen">
        {/* Top bar header (64px) */}
        <header className="h-16 bg-surface/50 backdrop-blur-md border-b border-border/80 px-8 flex items-center justify-between sticky top-0 z-20">
          {/* Breadcrumb + Live Indicator */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-display font-semibold tracking-tight text-text-primary">{getBreadcrumb()}</span>
            
            {/* Pulsing LIVE Dot */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface/60 border border-border">
              <span className={`h-1.5 w-1.5 rounded-full ${
                isWsConnected ? 'bg-success animate-pulse shadow-[0_0_8px_var(--success)]' : 'bg-text-hint'
              }`} />
              <span className="text-[9px] font-display font-bold uppercase tracking-wider text-text-muted">
                {isWsConnected ? 'Live' : 'Syncing'}
              </span>
            </div>
          </div>

          {/* Right Header actions */}
          <div className="flex items-center gap-4">
            {/* Search trigger mockup */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-hint" />
              <input
                type="text"
                placeholder="Search analytics..."
                className="bg-base border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-text-primary placeholder-text-hint focus:outline-none focus:border-accent w-48 transition-all duration-300 focus:w-60"
              />
            </div>

            {/* Active Dataset Picker Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-base hover:bg-surface text-xs font-medium text-text-primary transition-colors focus:outline-none"
              >
                <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
                <span className="max-w-[120px] truncate">{currentDatasetName}</span>
              </button>
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-56 rounded-lg border border-border bg-surface shadow-xl z-40 p-1">
                    {mockDatasets.map((dataset) => (
                      <button
                        key={dataset.id}
                        onClick={() => {
                          setActiveDataset(dataset.id);
                          setIsDropdownOpen(false);
                          toast.success(`Swapped workspace context to ${dataset.name}`);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${
                          activeDataset === dataset.id 
                            ? 'bg-accent/10 text-accent font-semibold' 
                            : 'text-text-muted hover:bg-base hover:text-text-primary'
                        }`}
                      >
                        {dataset.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Date Range Picker Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsDateOpen(!isDateOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-base hover:bg-surface text-xs font-medium text-text-primary transition-colors focus:outline-none"
              >
                <Calendar className="h-3.5 w-3.5 text-text-muted" />
                <span>
                  {activeDateRange === '7d' ? 'Last 7 days' : activeDateRange === '30d' ? 'Last 30 days' : activeDateRange === '90d' ? 'Last 90 days' : 'Custom range'}
                </span>
              </button>
              {isDateOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsDateOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-40 rounded-lg border border-border bg-surface shadow-xl z-40 p-1">
                    {[
                      { id: '7d', label: 'Last 7 days' },
                      { id: '30d', label: 'Last 30 days' },
                      { id: '90d', label: 'Last 90 days' }
                    ].map((range) => (
                      <button
                        key={range.id}
                        onClick={() => {
                          setActiveDateRange(range.id);
                          setIsDateOpen(false);
                          toast.success(`Date scope updated to ${range.label}`);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${
                          activeDateRange === range.id 
                            ? 'bg-accent/10 text-accent font-semibold' 
                            : 'text-text-muted hover:bg-base hover:text-text-primary'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Notification Bell trigger */}
            <button className="p-1.5 rounded-lg border border-border bg-base hover:bg-surface text-text-muted hover:text-text-primary transition-colors relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
            </button>
          </div>
        </header>

        {/* Content Pane Wrapper */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
