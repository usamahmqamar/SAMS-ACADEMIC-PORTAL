import React from 'react';
import { 
  Activity, 
  Clock, 
  User, 
  DollarSign, 
  BookOpen, 
  Package, 
  ShieldAlert,
  CheckCircle2,
  FileText
} from 'lucide-react';

export interface AuditLogItem {
  id: string;
  userEmail?: string;
  module?: string;
  action?: string;
  recordId?: string;
  createdAt?: string;
  branchName?: string;
}

interface RecentActivityPanelProps {
  logs: AuditLogItem[];
  loading: boolean;
}

export const RecentActivityPanel: React.FC<RecentActivityPanelProps> = ({
  logs,
  loading
}) => {
  const getModuleIcon = (module?: string) => {
    switch (module?.toLowerCase()) {
      case 'finance':
      case 'payment':
      case 'billing':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-500" />;
      case 'academics':
      case 'results':
      case 'curriculum':
        return <BookOpen className="w-3.5 h-3.5 text-indigo-500" />;
      case 'inventory':
      case 'store':
        return <Package className="w-3.5 h-3.5 text-amber-500" />;
      case 'auth':
      case 'iam':
      case 'security':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return 'Just now';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (' + d.toLocaleDateString() + ')';
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-3 animate-pulse">
        <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="space-y-2 pt-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
            System Audit Trail
          </h3>
        </div>
        <span className="text-[10.5px] font-mono text-slate-400">public.audit_logs</span>
      </div>

      <div className="space-y-2.5">
        {logs.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            No system audit logs recorded for the selected scope.
          </div>
        ) : (
          logs.slice(0, 5).map(log => (
            <div
              key={log.id}
              className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-white dark:bg-slate-700 shadow-3xs">
                  {getModuleIcon(log.module)}
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {log.action || 'System Action'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    By: {log.userEmail || 'System Agent'} {log.branchName ? `[${log.branchName}]` : ''}
                  </p>
                </div>
              </div>

              <div className="text-right font-mono text-[10px] text-slate-400 shrink-0">
                {formatTimestamp(log.createdAt)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivityPanel;
