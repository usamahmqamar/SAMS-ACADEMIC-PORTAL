import React from 'react';
import { 
  X, 
  User, 
  ShieldCheck, 
  Building2, 
  BadgeCheck, 
  Mail, 
  Phone, 
  Briefcase, 
  Calendar, 
  Lock, 
  LogOut,
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeId?: string;
  phone?: string;
  position?: string;
  department?: string;
  primaryBranch?: string;
  additionalBranches?: string[];
  status?: string;
  avatarUrl?: string;
  isSuperAdmin?: boolean;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfileData | null;
  onLogout: () => void;
  branches?: { id: string; branch_name: string; branch_code: string }[];
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onLogout,
  branches = []
}) => {
  if (!isOpen || !profile) return null;

  const getBranchName = (code?: string) => {
    if (!code || code === 'All') return 'All Campuses (Central HQ)';
    const found = (branches || []).find(b => b.branch_code === code);
    return found ? `${found.branch_name} (${found.branch_code})` : `${code} Campus`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  profile.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                  <span>{profile.name}</span>
                  <BadgeCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {profile.employeeId ? `ID: ${profile.employeeId}` : profile.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5 overflow-y-auto">
            {/* Account Status Pill Banner */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  Supabase IAM Verified Session
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 uppercase tracking-wider">
                {profile.status || 'Active'}
              </span>
            </div>

            {/* Core Identity Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identity & Role Details</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Assigned System Role</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{profile.role}</p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Official Designation</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {profile.position || profile.role}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Primary Email</span>
                  </div>
                  <p className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 truncate">
                    {profile.email}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Official Phone</span>
                  </div>
                  <p className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200">
                    {profile.phone || 'Not Specified'}
                  </p>
                </div>
              </div>
            </div>

            {/* Branch Access Information */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Authorized Campus Scope</span>
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
              </h4>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Primary Assignment:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {getBranchName(profile.primaryBranch)}
                  </span>
                </div>

                {profile.additionalBranches && profile.additionalBranches.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <p className="text-[11px] text-slate-500 mb-1.5">Permitted Branches:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.additionalBranches.map((br) => (
                        <span 
                          key={br}
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-bold"
                        >
                          {getBranchName(br)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/50 rounded-xl text-amber-800 dark:text-amber-300 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Lock className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Enterprise Row Level Security Active</span>
              </div>
              <p className="text-[10.5px] leading-relaxed text-amber-700 dark:text-amber-400">
                Your database queries are validated and restricted by Postgres RLS policies in accordance with your assigned role and campus authorization.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Close Window
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Session</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UserProfileModal;
