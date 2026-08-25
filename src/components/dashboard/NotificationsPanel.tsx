import React from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  BookOpen,
  DollarSign,
  Package,
  Calendar,
  MessageSquare,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export interface DashboardNotification {
  id: string;
  type: 'fee_deadline' | 'exam' | 'result_pending' | 'teacher_task' | 'low_stock' | 'admission' | 'event' | 'parent_ticket';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp?: string;
  targetTab?: string;
  targetSubmenu?: string;
}

interface NotificationsPanelProps {
  notifications: DashboardNotification[];
  loading: boolean;
  onNavigateTab: (tab: string, submenu?: string) => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  loading,
  onNavigateTab
}) => {
  const getIcon = (type: DashboardNotification['type']) => {
    switch (type) {
      case 'fee_deadline':
        return <DollarSign className="w-4 h-4 text-amber-500" />;
      case 'exam':
      case 'result_pending':
        return <BookOpen className="w-4 h-4 text-indigo-500" />;
      case 'low_stock':
        return <Package className="w-4 h-4 text-rose-500" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'parent_ticket':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const getPriorityBadge = (p: DashboardNotification['priority']) => {
    switch (p) {
      case 'urgent':
      case 'high':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/60';
      case 'medium':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60';
      default:
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-3 animate-pulse">
        <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="space-y-2 pt-2">
          {[1, 2].map(i => (
            <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
            Operational Alerts & Actions
          </h3>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
          {notifications.length} Active
        </span>
      </div>

      <div className="space-y-2.5">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            No pending operational alerts or overdue deadlines.
          </div>
        ) : (
          notifications.slice(0, 4).map(notif => (
            <div
              key={notif.id}
              onClick={() => notif.targetTab && onNavigateTab(notif.targetTab, notif.targetSubmenu)}
              className={`p-3 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start justify-between text-xs transition-all ${
                notif.targetTab ? 'cursor-pointer' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-3xs mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 dark:text-white">{notif.title}</p>
                    <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold uppercase ${getPriorityBadge(notif.priority)}`}>
                      {notif.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{notif.description}</p>
                </div>
              </div>

              {notif.targetTab && (
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 self-center" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;
