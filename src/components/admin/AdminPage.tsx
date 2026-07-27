import { useState } from 'react';
import { LayoutDashboard, Settings, LogOut, Menu, X, Package } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { RolimonsBrowser } from './RolimonsBrowser';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function AdminPage() {
  const { isAuthenticated, isLoading, logout } = useAdminAuth();
  const [activeTool, setActiveTool] = useState<'scraper' | 'rolimons' | 'settings'>('scraper');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="wb-grain fixed inset-0 z-0 pointer-events-none opacity-35 mix-blend-overlay" aria-hidden="true" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-white">Loading admin panel...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  const tools = [
    { id: 'scraper', label: 'Game Scraper', icon: LayoutDashboard },
    { id: 'rolimons', label: 'Rolimons Items', icon: Package },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="wb-grain fixed inset-0 z-0 pointer-events-none opacity-35 mix-blend-overlay" aria-hidden="true" />
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-sm border-r border-slate-800 transform transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-white text-lg">WhatBlox Admin</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-slate-800"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {tools.map(tool => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool.id as 'scraper' | 'settings');
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon size={18} />
                  <span>{tool.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-red-400 transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 rounded-lg hover:bg-slate-800"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            <h1 className="font-bold text-white">Admin Panel</h1>
            <div className="w-10" />
          </div>
        </header>

        {/* Page content */}
        <div className="pt-16 lg:pt-0">
          <ScrollArea className="h-[calc(100vh-4rem)] lg:h-[calc(100vh)]">
            <div className="p-4 lg:p-6 space-y-6">
              {activeTool === 'scraper' && <AdminDashboard />}
              {activeTool === 'rolimons' && <RolimonsBrowser />}
              {activeTool === 'settings' && <AdminSettings />}
            </div>
          </ScrollArea>
        </div>
      </main>
    </div>
  );
}

function AdminSettings() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-slate-400">Configure admin panel settings</p>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Environment Status</h2>
        <div className="space-y-3">
          <EnvStatus name="VITE_SUPABASE_URL" value={import.meta.env.VITE_SUPABASE_URL} required />
          <EnvStatus name="VITE_SUPABASE_ANON_KEY" value={import.meta.env.VITE_SUPABASE_ANON_KEY} required />
          <EnvStatus name="VITE_ADMIN_PASSWORD_HASH" value={import.meta.env.VITE_ADMIN_PASSWORD_HASH} required />
        </div>
      </div>

      <div className="mt-6 bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Generate Admin Password Hash</h2>
        <p className="text-sm text-slate-400 mb-4">
          Enter a password to generate a SHA-256 hash. Add this to your .env file as VITE_ADMIN_PASSWORD_HASH
        </p>
        <PasswordHashGenerator />
      </div>
    </div>
  );
}

function EnvStatus({ name, value, required }: { name: string; value: string | undefined; required: boolean }) {
  const configured = !!value;
  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-2.5 h-2.5 rounded-full',
          configured ? 'bg-green-500' : 'bg-red-500'
        )} />
        <span className="text-sm font-mono text-slate-300">{name}</span>
        {required && <span className="text-xs text-slate-500 px-1.5 py-0.5 bg-slate-700 rounded">Required</span>}
      </div>
      <span className={cn('text-sm', configured ? 'text-green-400' : 'text-red-400')}>
        {configured ? 'Configured' : 'Missing'}
      </span>
    </div>
  );
}

function PasswordHashGenerator() {
  const [password, setPassword] = useState('');
  const [hash, setHash] = useState('');
  const [copied, setCopied] = useState(false);

  const generateHash = async () => {
    if (!password) return;
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    setHash(hashHex);
    setCopied(false);
  };

  const copyHash = () => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-slate-300 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter password to hash"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
      <Button onClick={generateHash} variant="outline" disabled={!password}>
        Generate SHA-256 Hash
      </Button>
      {hash && (
        <div className="space-y-2">
          <label className="block text-sm text-slate-300">Hash (copy to .env)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={hash}
              readOnly
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono"
            />
            <Button variant="ghost" size="sm" onClick={copyHash}>
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <code className="text-xs text-slate-500 font-mono">VITE_ADMIN_PASSWORD_HASH={hash}</code>
        </div>
      )}
    </div>
  );
}