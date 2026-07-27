import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MaintenancePage } from '@/components/landing/MaintenancePage';

interface MaintenanceConfig {
  id: string;
  enabled: boolean;
  message: string | null;
  estimated_time: string | null;
  message_app: string | null;
  message_landing: string | null;
  estimated_time_app: string | null;
  estimated_time_landing: string | null;
}

interface MaintenanceState {
  isMaintenance: boolean;
  loading: boolean;
  message: string | null;
  estimatedEnd: string | null;
  retryAfter: number | null;
}

export function useMaintenance(): MaintenanceState {
  const [state, setState] = useState<MaintenanceState>({
    isMaintenance: false,
    loading: true,
    message: null,
    estimatedEnd: null,
    retryAfter: null,
  });

  useEffect(() => {
    let mounted = true;

    async function checkMaintenance() {
      try {
        const { data, error } = await supabase
          .from('maintenance_config')
          .select('*')
          .eq('id', '00000000-0000-0000-0000-000000000001')
          .single<MaintenanceConfig>();

        if (error) {
          console.warn('Failed to fetch maintenance config:', error.message);
        }

        if (mounted) {
          const isMaintenance = data?.enabled ?? false;
          const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
          const isAppDomain = hostname.includes('app.whatblox.com') || hostname.includes('localhost:3000') || hostname.includes('127.0.0.1:3000');
          
          let message = data?.message ?? 'We\'re performing scheduled maintenance. Please check back soon.';
          let estimatedTime = data?.estimated_time ?? 'We\'ll be back shortly';

          if (isAppDomain) {
            message = data?.message_app ?? data?.message ?? message;
            estimatedTime = data?.estimated_time_app ?? data?.estimated_time ?? estimatedTime;
          } else {
            message = data?.message_landing ?? data?.message ?? message;
            estimatedTime = data?.estimated_time_landing ?? data?.estimated_time ?? estimatedTime;
          }

          setState({
            isMaintenance,
            loading: false,
            message,
            estimatedEnd: estimatedTime,
            retryAfter: 300,
          });
        }
      } catch (err) {
        console.error('Maintenance check failed:', err);
        if (mounted) {
          setState({
            isMaintenance: false,
            loading: false,
            message: null,
            estimatedEnd: null,
            retryAfter: null,
          });
        }
      }
    }

    checkMaintenance();
    
    const interval = setInterval(checkMaintenance, 60000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return state;
}

export function MaintenanceGate({ 
  children, 
  fallback,
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { isMaintenance, loading, message, estimatedEnd } = useMaintenance();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#161617',
        color: '#F5F5F3',
        fontFamily: 'General Sans, Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            border: '3px solid rgba(109, 106, 247, 0.3)', 
            borderTopColor: '#6D6AF7',
            borderRadius: '50%', 
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#9FA0A3', fontSize: 15 }}>Loading...</p>
        </div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @media (prefers-reduced-motion: reduce) {
            * { animation: none !important; }
          }
        `}</style>
      </div>
    );
  }

  if (isMaintenance) {
    return fallback ?? (
      <MaintenancePage 
        message={message || 'We\'re making WhatBlox even better. Be right back!'}
        estimatedTime={estimatedEnd || 'We\'ll be back shortly'}
        showRetry={true}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return <>{children}</>;
}