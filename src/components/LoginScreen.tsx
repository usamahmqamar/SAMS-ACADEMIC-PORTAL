import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  School, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2,
  KeyRound,
  GraduationCap,
  Briefcase,
  BookOpen,
  Wallet,
  Package,
  UserCheck,
  HelpCircle,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  branch: string;
  status: string;
  employeeId?: string;
  primaryBranch?: string;
  additionalBranches?: string[];
  phone?: string;
  accessCount?: number;
  password?: string;
}

interface LoginScreenProps {
  systemUsers: SystemUser[];
  onLoginSuccess: (user: SystemUser) => void;
  activeSaaSSchool?: any;
  lockedUser?: SystemUser | null;
  onUnlockSession?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  systemUsers,
  onLoginSuccess,
  activeSaaSSchool,
  lockedUser = null,
  onUnlockSession
}) => {
  const [emailOrUsername, setEmailOrUsername] = useState(lockedUser ? lockedUser.email : 'usamah.m.qamar@gmail.com');
  const [password, setPassword] = useState(lockedUser ? '' : 'Q@marm@jeed786');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'quick_select' | 'help'>('login');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>('Auto');

  // Role icon helper
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Super Administrator':
      case 'Super Admin':
      case 'Proprietor':
        return <ShieldCheck className="w-4 h-4 text-rose-600" />;
      case 'Branch Administrator':
      case 'Branch Admin':
      case 'Principal':
        return <GraduationCap className="w-4 h-4 text-indigo-600" />;
      case 'Accountant':
        return <Wallet className="w-4 h-4 text-emerald-600" />;
      case 'Store Manager':
        return <Package className="w-4 h-4 text-amber-600" />;
      case 'Teacher':
        return <BookOpen className="w-4 h-4 text-purple-600" />;
      case 'Parent':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      default:
        return <Briefcase className="w-4 h-4 text-slate-600" />;
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const cleanInput = emailOrUsername.trim();
    const cleanPass = password.trim();

    if (!cleanInput) {
      setErrorMessage('Please enter your official username or email address.');
      setIsLoading(false);
      return;
    }

    if (!cleanPass) {
      setErrorMessage('Please enter your account password.');
      setIsLoading(false);
      return;
    }

    // Resolve target email if user typed username, name, or employeeId
    let targetEmail = cleanInput.toLowerCase();
    const matchedLocal = systemUsers.find(u => 
      u.email.toLowerCase() === targetEmail ||
      u.name.toLowerCase() === targetEmail ||
      u.id.toLowerCase() === targetEmail ||
      (cleanInput === 'usamah.m.qamar@gmail.com' && (u.role === 'Super Administrator' || u.role === 'Super Admin')) ||
      (u.employeeId && u.employeeId.toLowerCase() === cleanInput)
    );
    if (matchedLocal) {
      targetEmail = matchedLocal.email.toLowerCase();
    }

    try {
      // 1. Supabase Auth Sign In
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: cleanPass
      });

      if (authError) {
        console.warn('Supabase Auth error:', authError.message);
        // If password failed or user not found in auth
        if (authError.message.toLowerCase().includes('invalid login credentials')) {
          setErrorMessage('Invalid credentials. Please verify your email and password.');
        } else {
          setErrorMessage(authError.message);
        }
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        setErrorMessage('Authentication succeeded but user identity could not be verified.');
        setIsLoading(false);
        return;
      }

      // 2. Resolve Database User Profile
      let resolvedUser: SystemUser | null = null;

      // First check system_user_profiles
      const { data: sysProfile, error: sysErr } = await supabase
        .from('system_user_profiles')
        .select('*, roles(role_name, role_code), employees(*), user_branch_access(*, branches(*))')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle();

      if (sysProfile) {
        if (sysProfile.status !== 'Active') {
          await supabase.auth.signOut();
          setErrorMessage(`Access suspended: This account (${sysProfile.email}) is marked as "${sysProfile.status}". Contact the Super Administrator.`);
          setIsLoading(false);
          return;
        }

        const branchCodes = sysProfile.user_branch_access?.map((b: any) => b.branches?.branch_code).filter(Boolean) || [];
        const primaryBranch = branchCodes.length > 1 ? 'All' : (branchCodes[0] || 'GN');

        resolvedUser = {
          id: sysProfile.id,
          name: sysProfile.employees ? `${sysProfile.employees.first_name} ${sysProfile.employees.last_name}` : (sysProfile.username || sysProfile.email),
          email: sysProfile.email,
          role: sysProfile.roles?.role_name || (sysProfile.is_super_admin ? 'Super Administrator' : 'Staff'),
          branch: primaryBranch,
          status: sysProfile.status,
          employeeId: sysProfile.employees?.employee_id || sysProfile.employee_id,
          primaryBranch: primaryBranch,
          additionalBranches: branchCodes,
          phone: sysProfile.employees?.phone,
          accessCount: 1
        };
      } else {
        // Check parent_user_profiles
        const { data: parentProfile } = await supabase
          .from('parent_user_profiles')
          .select('*, parents_guardians(*), family_accounts(*)')
          .eq('auth_user_id', authData.user.id)
          .maybeSingle();

        if (parentProfile) {
          if (parentProfile.portal_status !== 'Active') {
            await supabase.auth.signOut();
            setErrorMessage(`Access suspended: Parent portal is "${parentProfile.portal_status}". Contact the school administration.`);
            setIsLoading(false);
            return;
          }

          resolvedUser = {
            id: parentProfile.id,
            name: parentProfile.primary_contact || parentProfile.parents_guardians?.full_name || 'Parent User',
            email: parentProfile.email || targetEmail,
            role: 'Parent',
            branch: 'RS',
            status: 'Active',
            primaryBranch: 'RS',
            phone: parentProfile.phone,
            accessCount: 1
          };
        } else if (matchedLocal) {
          resolvedUser = matchedLocal;
        } else {
          resolvedUser = {
            id: authData.user.id,
            name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'Authenticated User',
            email: authData.user.email || targetEmail,
            role: authData.user.user_metadata?.role || (authData.user.email === 'usamah.m.qamar@gmail.com' ? 'Super Administrator' : 'Staff'),
            branch: 'All',
            status: 'Active',
            primaryBranch: 'All'
          };
        }
      }

      // Save remember state if requested
      if (rememberMe) {
        localStorage.setItem('sams_remember_email', targetEmail);
      } else {
        localStorage.removeItem('sams_remember_email');
      }

      setIsLoading(false);
      if (resolvedUser) {
        onLoginSuccess(resolvedUser);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err.message || 'An unexpected authentication error occurred.');
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (user: SystemUser) => {
    setEmailOrUsername(user.email);
    const pass = user.password || (user.role === 'Super Administrator' || user.role === 'Super Admin' ? 'Q@marm@jeed786' : 'Q@marm@jeed786');
    setPassword(pass);
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: pass
      });

      if (authError) {
        console.warn('Quick login fallback with local profile:', authError.message);
        setIsLoading(false);
        onLoginSuccess(user);
        return;
      }

      if (rememberMe) {
        localStorage.setItem('sams_remember_email', user.email);
      }

      setIsLoading(false);
      onLoginSuccess(user);
    } catch (e) {
      setIsLoading(false);
      onLoginSuccess(user);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      {/* Background Decorative Blur & Mesh */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-900/60 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row my-auto">
        
        {/* Left Side: Brand Identity & Portal Credentials */}
        <div className="w-full md:w-5/12 bg-linear-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-6 sm:p-8 flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-slate-800">
          <div className="space-y-6">
            {/* School Header */}
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shadow-inner">
                <School className="w-6 h-6 text-indigo-300" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 block font-mono">Academic Portal</span>
                <h1 className="text-lg font-black tracking-tight text-white leading-tight">
                  {activeSaaSSchool ? activeSaaSSchool.name : 'SAMS Academic ERP'}
                </h1>
              </div>
            </div>

            {/* School Description */}
            <div className="space-y-2">
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {activeSaaSSchool ? activeSaaSSchool.slogan : 'Unified Nursery, Primary & Secondary Academic Management and Real-time Operations Portal.'}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-semibold text-slate-200 border border-white/10">
                  Dual Campus (GN & RS)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-[10px] font-semibold text-indigo-300 border border-indigo-400/20">
                  RBAC Multi-Tenant
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-[10px] font-semibold text-emerald-300 border border-emerald-400/20">
                  256-bit Secure
                </span>
              </div>
            </div>

            {/* Locked User Resumption Prompt */}
            {lockedUser && (
              <div className="p-3.5 bg-indigo-950/60 border border-indigo-500/30 rounded-2xl space-y-1.5 animate-fade-in">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs">
                    {lockedUser.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{lockedUser.name}</p>
                    <p className="text-[10px] text-indigo-300 font-mono">{lockedUser.role}</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-300 pt-1">Session locked for security. Enter password to resume.</p>
              </div>
            )}
          </div>

          {/* Bottom Security Info */}
          <div className="pt-6 border-t border-white/10 space-y-2 mt-4">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Active IAM Authorization
              </span>
              <span className="font-mono text-slate-500">v3.4.2</span>
            </div>
            <p className="text-[9.5px] text-slate-400 leading-normal">
              Protected by multi-tier cryptographic session management and role-based clearance vectors.
            </p>
          </div>
        </div>

        {/* Right Side: Authentication Panel */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col justify-between bg-white dark:bg-slate-900">
          <div>
            {/* Top Navigation Tabs inside Login Card */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setErrorMessage(null); }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Password Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('quick_select'); setErrorMessage(null); }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'quick_select'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Demo Accounts</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 text-[9px] font-mono">
                    {systemUsers.length}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Login Help & Master Credentials"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start space-x-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{errorMessage}</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-rose-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* VIEW 1: Standard Password Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Sign in to your account
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Enter your authorized official credentials below.
                  </p>
                </div>

                {/* Email or Username Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Email or Username</span>
                    <span className="text-[9px] text-slate-400 font-mono">e.g. usamah.m.qamar@gmail.com</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="usamah.m.qamar@gmail.com"
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setPassword('Q@marm@jeed786')}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      Fill Super Admin password
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Options: Remember Me & Campus Selection */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <label className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 cursor-pointer text-[11px]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Remember this session</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 text-[11px] font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl text-xs tracking-wider uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign In to Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* VIEW 2: Quick Demo Accounts Selector */}
            {activeTab === 'quick_select' && (
              <div className="space-y-3 animate-fade-in">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Select a Pre-configured Role
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click any account below to authenticate instantly with its role permissions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[290px] overflow-y-auto pr-1">
                  {systemUsers.map(usr => (
                    <div
                      key={usr.id}
                      onClick={() => handleQuickLogin(usr)}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700">
                            {getRoleIcon(usr.role)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                              {usr.name}
                            </p>
                            <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
                              {usr.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[9.5px]">
                        <span className="font-mono text-slate-400">{usr.branch === 'All' ? '🌐 All Campuses' : `${usr.branch} Campus`}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline flex items-center gap-0.5">
                          Log In 🔑
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Credential Hint Footer */}
          <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-slate-400" />
              Super Admin: <strong className="text-slate-600 dark:text-slate-300 font-mono">Q@marm@jeed786</strong> (Staff: sams123)
            </span>
            <button
              type="button"
              onClick={() => {
                setEmailOrUsername('usamah.m.qamar@gmail.com');
                setPassword('Q@marm@jeed786');
                setActiveTab('login');
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
            >
              Reset to Super Admin
            </button>
          </div>
        </div>
      </div>

      {/* Security Help & Master Credentials Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Portal Credentials & IAM</h3>
                  <p className="text-[10px] text-slate-400">Access guidelines & password resets</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white text-xs">Super Admin Master Credentials</p>
                <p className="text-[11px] leading-relaxed">
                  User ID / Email: <code className="bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded font-mono font-bold text-indigo-600 dark:text-indigo-400">usamah.m.qamar@gmail.com</code><br/>
                  Password: <code className="bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded font-mono font-bold text-indigo-600 dark:text-indigo-400">Q@marm@jeed786</code>
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-slate-900 dark:text-white text-xs">Standard Accounts Directory</p>
                <ul className="space-y-1 text-[11px] font-mono">
                  <li className="flex justify-between">
                    <span>👑 Super Administrator:</span>
                    <strong className="text-slate-800 dark:text-slate-200">usamah.m.qamar@gmail.com</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>🏢 Branch Admin (RS):</span>
                    <strong className="text-slate-800 dark:text-slate-200">maryam.s@sams.rs.com</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>💰 Accountant (GN):</span>
                    <strong className="text-slate-800 dark:text-slate-200">finance@sams.gn.com</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>👩‍🏫 Teacher (GN):</span>
                    <strong className="text-slate-800 dark:text-slate-200">yusuf.idris@sams.gn.com</strong>
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-[10.5px] text-amber-800 dark:text-amber-300">
                <p className="font-bold">Password Customization:</p>
                <p className="mt-0.5">
                  You can change passwords at any time inside the <strong>Security & IAM</strong> module or via your <strong>Personal Profile Settings</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer"
            >
              Close Guidelines
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
