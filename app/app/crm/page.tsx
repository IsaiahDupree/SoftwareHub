'use client';

// CRM-001: EverReach CRM SaaS hosted on SoftwareHub
// CRM-002: User authentication integration (SSO)
// CRM-003: Multi-tenant data isolation

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CRMTenant {
  id: string;
  workspace_name: string;
  workspace_slug: string;
  created_at: string;
}

interface ContactStats {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  followups_due: number;
}

export default function CRMPage() {
  const router = useRouter();
  const [tenant, setTenant] = useState<CRMTenant | null>(null);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');

  useEffect(() => {
    fetchTenantData();
  }, []);

  const fetchTenantData = async () => {
    try {
      const res = await fetch('/api/crm/workspace');
      if (res.status === 404) {
        setShowSetup(true);
        setIsLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to load workspace');
      const data = await res.json();
      setTenant(data.workspace);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) return;
    try {
      const res = await fetch('/api/crm/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_name: workspaceName.trim() }),
      });
      if (!res.ok) throw new Error('Failed to create workspace');
      const data = await res.json();
      setTenant(data.workspace);
      setStats({ total: 0, hot: 0, warm: 0, cold: 0, followups_due: 0 });
      setShowSetup(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace');
    }
  };

  const handleLaunchCRM = async () => {
    if (!tenant) return;
    setIsLaunching(true);
    try {
      const res = await fetch('/api/crm/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_slug: tenant.workspace_slug }),
      });
      if (!res.ok) throw new Error('Failed to generate SSO link');
      const data = await res.json();
      window.open(data.sso_url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launch CRM');
    } finally {
      setIsLaunching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (showSetup) {
    return (
      <div className="max-w-lg mx-auto mt-12 p-6">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🤝</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Set Up EverReach CRM</h1>
          <p className="text-gray-500 mt-2">Create your CRM workspace to start managing relationships</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Workspace Name
          </label>
          <input
            type="text"
            value={workspaceName}
            onChange={e => setWorkspaceName(e.target.value)}
            placeholder="e.g., My Business CRM"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            onKeyDown={e => e.key === 'Enter' && handleCreateWorkspace()}
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <button
            onClick={handleCreateWorkspace}
            disabled={!workspaceName.trim()}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Create Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">EverReach CRM</h1>
          <p className="text-gray-500 text-sm mt-1">Workspace: {tenant?.workspace_name}</p>
        </div>
        <button
          onClick={handleLaunchCRM}
          disabled={isLaunching}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
        >
          {isLaunching ? (
            <>
              <span className="animate-spin">⏳</span>
              Launching...
            </>
          ) : (
            <>
              🚀 Open CRM
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard label="Total Contacts" value={stats.total} color="blue" />
          <StatCard label="Hot (80-100)" value={stats.hot} color="green" />
          <StatCard label="Warm (50-79)" value={stats.warm} color="yellow" />
          <StatCard label="Cold (<40)" value={stats.cold} color="red" />
          <StatCard label="Follow-ups Due" value={stats.followups_due} color="purple" urgent={stats.followups_due > 0} />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <QuickActionCard
          icon="👥"
          title="Add Contacts"
          description="Add individual contacts or import from CSV/vCard"
          onClick={() => router.push('/app/crm/contacts/new')}
        />
        <QuickActionCard
          icon="📋"
          title="View Follow-up Queue"
          description={`${stats?.followups_due ?? 0} contact${(stats?.followups_due ?? 0) !== 1 ? 's' : ''} need attention`}
          onClick={handleLaunchCRM}
          highlight={!!stats?.followups_due}
        />
        <QuickActionCard
          icon="📊"
          title="Relationship Analytics"
          description="View your network health dashboard and trends"
          onClick={handleLaunchCRM}
        />
        <QuickActionCard
          icon="⚙️"
          title="CRM Settings"
          description="Configure warmth decay, reminders, and integrations"
          onClick={handleLaunchCRM}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, color, urgent }: { label: string; value: number; color: string; urgent?: boolean }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    green: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    yellow: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
    red: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  };

  return (
    <div className={`rounded-xl p-4 ${colorMap[color]} ${urgent ? 'ring-2 ring-purple-500' : ''}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-1 opacity-80">{label}</p>
    </div>
  );
}

function QuickActionCard({ icon, title, description, onClick, highlight }: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-5 rounded-xl border transition-all hover:shadow-md ${
        highlight
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 hover:border-purple-600'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'
      }`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </button>
  );
}
