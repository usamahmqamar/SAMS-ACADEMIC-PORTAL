import React, { useState, useRef, useEffect } from 'react';
import {
  School,
  Building2,
  ChevronDown,
  User,
  ShieldCheck,
  LogOut,
  Sparkles,
  Search,
  Moon,
  Sun,
  Lock,
  BadgeCheck,
  CheckCircle2,
  KeyRound,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfileModal, UserProfileData } from './UserProfileModal';

interface BranchItem {
  id: string;
  branch_name: string;
  branch_code: string;
}

interface DashboardHeaderProps {
  currentActiveUser?: any;
  currentUser?: any;
  currentSimulatedRole?: string;
  currentRole?: string;
  selectedBranch?: 'All' | 'GN' | 'RS';
  setSelectedBranch?: (branch: 'All' | 'GN' | 'RS') => void;
  onBranchChange?: (branch: 'All' | 'GN' | 'RS') => void;
  availableBranches?: BranchItem[];
  userPermittedBranches?: string[];
  isSuperAdmin?: boolean;
  onLogout?: () => void;
  onOpenSearch?: () => void;
  theme?: string;
  setTheme?: React.Dispatch<React.SetStateAction<string>> | ((theme: string) => void);
  aiConfigured?: boolean;
  onRoleChange?: (role: string) => void;
  onProfileUpdated?: () => void;
  activeSchoolConfig?: any;
  schoolLogoUrl?: string;
  onOpenSchoolSettings?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  currentActiveUser: propActiveUser,
  currentUser: propUser,
  currentSimulatedRole: propSimRole,
  currentRole: propRole,
  selectedBranch = 'GN',
  setSelectedBranch,
  onBranchChange,
  availableBranches = [],
  userPermittedBranches = [],
  isSuperAdmin: propSuperAdmin,
  onLogout = () => {},
  onOpenSearch = () => {},
  theme = 'light',
  setTheme,
  aiConfigured = false,
  onRoleChange,
  onProfileUpdated,
  activeSchoolConfig,
  schoolLogoUrl,
  onOpenSchoolSettings
}) => {
  const activeUser = propActiveUser || propUser;
  const activeRole = propSimRole || propRole || activeUser?.role || 'Super Administrator';
  const isSuperAdmin = propSuperAdmin ?? (activeRole === 'Super Administrator' || activeRole === 'Super Admin' || activeUser?.role === 'Super Administrator' || activeUser?.role === 'Super Admin');

  const handleBranchSelect = (branch: 'All' | 'GN' | 'RS') => {
    if (setSelectedBranch) setSelectedBranch(branch);
    if (onBranchChange) onBranchChange(branch);
  };

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const branchDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const employeeId = activeUser?.employeeId || activeUser?.employee_id;
  const userInitials = (activeUser?.name || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const getBranchLabel = (code: string) => {
    if (code === 'All') return 'All Branches (HQ)';
    const found = (availableBranches || []).find(b => b.branch_code === code);
    return found ? `${found.branch_name} (${found.branch_code})` : `${code} Branch`;
  };

  // Determine selectable branch codes based on permissions
  const selectableBranchCodes = React.useMemo(() => {
    if (isSuperAdmin || activeRole === 'Proprietor' || activeRole === 'Store Manager' || activeRole === 'Super Administrator' || activeRole === 'Super Admin') {
      return ['All', 'GN', 'RS'];
    }
    const permitted = Array.isArray(userPermittedBranches) && userPermittedBranches.length > 0
      ? userPermittedBranches
      : Array.isArray(activeUser?.authorizedBranches) && activeUser.authorizedBranches.length > 0
      ? activeUser.authorizedBranches
      : [selectedBranch];
    return permitted;
  }, [isSuperAdmin, activeRole, userPermittedBranches, activeUser, selectedBranch]);

  const hasMultipleBranches = (selectableBranchCodes || []).length > 1;

  const profileModalData: UserProfileData = {
    id: activeUser?.id || 'usr-active',
    name: activeUser?.name || 'Authorized User',
    email: activeUser?.email || '',
    role: activeRole,
    employeeId: employeeId,
    phone: activeUser?.phone,
    position: activeUser?.position,
    department: activeUser?.department,
    primaryBranch: activeUser?.primaryBranch || selectedBranch,
    additionalBranches: Array.isArray(userPermittedBranches) ? userPermittedBranches : [],
    status: activeUser?.status || 'Active',
    avatarUrl: activeUser?.avatarUrl,
    isSuperAdmin
  };

  return (
    <>
      <header
        id="sams-unified-header"
        className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40 px-3 md:px-6 py-2.5 flex items-center justify-between shadow-3xs"
      >
        {/* Left Side: Brand Logo & Title */}
        <div 
          onClick={onOpenSchoolSettings}
          className={`flex items-center space-x-3 ${onOpenSchoolSettings ? 'cursor-pointer group' : ''}`}
          title={onOpenSchoolSettings ? "Click to manage School Brand Identity & Logo" : undefined}
        >
          <div className="w-8 h-8 md:w-9 md:h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0 overflow-hidden p-1 border border-indigo-500/30">
            {schoolLogoUrl || activeSchoolConfig?.customLogoUrl ? (
              <img
                src={schoolLogoUrl || activeSchoolConfig.customLogoUrl}
                alt={activeSchoolConfig?.name || "School Logo"}
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            ) : (
              <School className="w-4 h-4 md:w-5 md:h-5 text-white" />
            )}
          </div>

          <div className="leading-tight">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-sm md:text-base tracking-tight text-slate-950 dark:text-white uppercase font-sans group-hover:text-indigo-600 transition-colors">
                {activeSchoolConfig?.shortCode ? `${activeSchoolConfig.shortCode} ERP` : 'SAMS ERP'}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-[9px] font-bold border border-indigo-200/60 dark:border-indigo-800">
                PROD
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium hidden sm:block truncate max-w-[200px]">
              {activeSchoolConfig?.name || 'Integrated School Administration'}
            </p>
          </div>
        </div>

        {/* Middle / Center: Dynamic Branch Selector */}
        <div className="flex items-center space-x-2">
          {hasMultipleBranches ? (
            <div className="relative" ref={branchDropdownRef}>
              <button
                type="button"
                id="branch-selector-button"
                onClick={() => setIsBranchDropdownOpen(prev => !prev)}
                className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 transition-all shadow-3xs cursor-pointer"
                title="Switch Active Campus Scope"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline font-bold">{getBranchLabel(selectedBranch)}</span>
                <span className="sm:hidden font-mono text-indigo-600 font-bold">{selectedBranch}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Branch Dropdown Menu */}
              <AnimatePresence>
                {isBranchDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 sm:right-0 sm:left-auto mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden"
                  >
                    <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Authorized Campus Scopes
                      </p>
                    </div>

                    <div className="p-1 space-y-0.5">
                      {selectableBranchCodes.map(code => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            handleBranchSelect(code as any);
                            setIsBranchDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                            selectedBranch === code
                              ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Building2 className={`w-3.5 h-3.5 ${selectedBranch === code ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                            <span>{getBranchLabel(code)}</span>
                          </div>
                          {selectedBranch === code && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            // Single Branch Static Badge
            <div
              id="branch-static-badge"
              className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 shadow-3xs"
              title="Authorized Branch Campus"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{getBranchLabel(selectedBranch)}</span>
            </div>
          )}
        </div>

        {/* Right Side: Search, Theme, AI Badge, and Authenticated User Menu */}
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* AI Status Badge */}
          <div
            id="ai-con-badge"
            className={`hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all shrink-0 ${
              aiConfigured
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/60'
                : 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/60'
            }`}
            title={aiConfigured ? 'Gemini AI Intelligent Engine Active' : 'Gemini AI Inactive'}
          >
            <Sparkles className={`w-3 h-3 ${aiConfigured ? 'fill-emerald-500 text-emerald-600 animate-pulse' : 'text-amber-500'}`} />
            <span>{aiConfigured ? 'Gemini AI' : 'AI Offline'}</span>
          </div>

          {/* User Profile Menu Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              id="user-profile-menu-button"
              onClick={() => setIsProfileMenuOpen(prev => !prev)}
              className="flex items-center space-x-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-3xs"
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-3xs overflow-hidden">
                {activeUser?.avatarUrl ? (
                  <img src={activeUser.avatarUrl} alt={activeUser.name} className="w-full h-full object-cover" />
                ) : (
                  userInitials
                )}
              </div>

              {/* User Name, Role & Employee ID */}
              <div className="text-left hidden md:block leading-tight max-w-[170px]">
                <p className="font-bold text-[11px] text-slate-900 dark:text-white truncate flex items-center gap-1">
                  <span>{activeUser?.name || 'Authorized User'}</span>
                </p>
                <div className="flex items-center gap-1 text-[9.5px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{activeRole}</span>
                  {employeeId && (
                    <span className="font-mono text-slate-400">&bull; {employeeId}</span>
                  )}
                </div>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Menu Dropdown */}
            <AnimatePresence>
              {isProfileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  {/* User Profile Card Summary */}
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <span>{activeUser?.name || 'Authorized User'}</span>
                      <BadgeCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    </p>
                    <p className="text-[10.5px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      {activeUser?.email}
                    </p>
                    <div className="pt-1.5 flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60">
                        {activeRole}
                      </span>
                      {employeeId && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {employeeId}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Links */}
                  <div className="p-1.5 space-y-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>My Profile & Identity</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">View</span>
                    </button>

                    <div className="px-3 py-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                      <span>Active Campus:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedBranch === 'All' ? 'All Campuses (HQ)' : `${selectedBranch} Branch`}
                      </span>
                    </div>
                  </div>

                  {/* Sign Out Button */}
                  <div className="p-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out / Lock Session</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* User Profile Details Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profileModalData}
        onLogout={onLogout}
        branches={availableBranches}
      />
    </>
  );
};

export default DashboardHeader;
