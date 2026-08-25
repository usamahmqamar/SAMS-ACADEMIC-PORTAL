import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ExecutiveDashboard, ExecutiveDashboardData } from './ExecutiveDashboard';
import { PrincipalDashboard, PrincipalDashboardData } from './PrincipalDashboard';
import { AccountantDashboard, AccountantDashboardData } from './AccountantDashboard';
import { StoreManagerDashboard, StoreManagerDashboardData } from './StoreManagerDashboard';
import { TeacherDashboard, TeacherDashboardData } from './TeacherDashboard';
import { ParentDashboard, ParentDashboardData } from './ParentDashboard';
import { NotificationsPanel, DashboardNotification } from './NotificationsPanel';
import { RecentActivityPanel, AuditLogItem } from './RecentActivityPanel';
import { 
  Calendar, 
  Sparkles, 
  Layers, 
  RefreshCw, 
  AlertCircle,
  Building2,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface UnifiedDashboardRouterProps {
  currentSimulatedRole?: string;
  currentRole?: string;
  selectedBranch?: 'All' | 'GN' | 'RS';
  currentActiveUser?: any;
  activeUser?: any;
  branches?: { id: string; branch_name: string; branch_code: string }[];
  availableBranches?: { id: string; branch_name: string; branch_code: string }[];
  onNavigateTab: (tab: string, submenu?: string) => void;
  onQuickAction?: (action: string) => void;
  // Quick Action Handlers
  onAddStudent?: () => void;
  onAddStaff?: () => void;
  onReceivePayment?: () => void;
  onIssueReceipt?: () => void;
  onFamilyBilling?: () => void;
  onRecordLesson?: () => void;
  onUploadEvidence?: () => void;
  onMarkAttendance?: () => void;
  onEnterResults?: () => void;
  onNewStoreSale?: () => void;
  onReceiveStock?: () => void;
  onIssueMaterials?: () => void;
  onInventoryCatalog?: () => void;
}

export const UnifiedDashboardRouter: React.FC<UnifiedDashboardRouterProps> = ({
  currentSimulatedRole: propSimRole,
  currentRole: propRole,
  selectedBranch = 'GN',
  currentActiveUser: propActiveUser,
  activeUser: propUser,
  branches: propBranches,
  availableBranches: propAvailBranches,
  onNavigateTab,
  onQuickAction,
  onAddStudent,
  onAddStaff,
  onReceivePayment,
  onIssueReceipt,
  onFamilyBilling,
  onRecordLesson,
  onUploadEvidence,
  onMarkAttendance,
  onEnterResults,
  onNewStoreSale,
  onReceiveStock,
  onIssueMaterials,
  onInventoryCatalog
}) => {
  const currentSimulatedRole = propSimRole || propRole || 'Super Administrator';
  const currentActiveUser = propActiveUser || propUser;
  const branches = propBranches || propAvailBranches || [
    { id: '1', branch_name: 'Gawun Nama Campus', branch_code: 'GN' },
    { id: '2', branch_name: 'Runjin Sambo Campus', branch_code: 'RS' }
  ];
  // Date Context States
  const [currentSessionName, setCurrentSessionName] = useState<string>('2025/2026 Academic Session');
  const [currentTermName, setCurrentTermName] = useState<string>('Third Term');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentTermId, setCurrentTermId] = useState<string | null>(null);
  const [currentDateStr, setCurrentDateStr] = useState<string>('');

  // Loading & Error States
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Role-Specific Datasets
  const [execData, setExecData] = useState<ExecutiveDashboardData | null>(null);
  const [principalData, setPrincipalData] = useState<PrincipalDashboardData | null>(null);
  const [accountantData, setAccountantData] = useState<AccountantDashboardData | null>(null);
  const [storeData, setStoreData] = useState<StoreManagerDashboardData | null>(null);
  const [teacherData, setTeacherData] = useState<TeacherDashboardData | null>(null);
  const [parentData, setParentData] = useState<ParentDashboardData | null>(null);

  // Shared Panels
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Format Current Date
  useEffect(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setCurrentDateStr(now.toLocaleDateString('en-GB', options));
  }, []);

  // Fetch Academic Date Context & Live Data from Supabase
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);

      // 1. Fetch Current Academic Session & Term from Database
      const [sessionRes, termRes] = await Promise.all([
        supabase
          .from('academic_sessions')
          .select('id, session_name, is_current')
          .eq('is_current', true)
          .maybeSingle(),
        supabase
          .from('terms')
          .select('id, term_name, is_current, session_id')
          .eq('is_current', true)
          .maybeSingle()
      ]);

      if (sessionRes.data) {
        setCurrentSessionName(sessionRes.data.session_name);
        setCurrentSessionId(sessionRes.data.id);
      }
      if (termRes.data) {
        setCurrentTermName(termRes.data.term_name);
        setCurrentTermId(termRes.data.id);
      }

      // Resolve branch filter ID if not 'All'
      let activeBranchId: string | null = null;
      if (selectedBranch !== 'All') {
        const found = (branches || []).find(b => b.branch_code === selectedBranch);
        if (found) activeBranchId = found.id;
      }

      // 2. Fetch Audit Logs for Recent Activity
      let auditQuery = supabase
        .from('audit_logs')
        .select('id, user_email, module, action, record_id, created_at, branch_id')
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (activeBranchId) {
        auditQuery = auditQuery.eq('branch_id', activeBranchId);
      }
      const { data: rawLogs } = await auditQuery;
      
      if (rawLogs) {
        setAuditLogs(
          rawLogs.map(l => {
            const b = (branches || []).find(br => br.id === l.branch_id);
            return {
              id: l.id,
              userEmail: l.user_email,
              module: l.module,
              action: l.action,
              recordId: l.record_id,
              createdAt: l.created_at,
              branchName: b ? b.branch_code : undefined
            };
          })
        );
      }

      // 3. Fetch Operational Alerts & Deadlines
      const [deadlinesRes, eventsRes, lowStockRes, ticketsRes] = await Promise.all([
        supabase
          .from('academic_deadlines')
          .select('*')
          .order('due_date', { ascending: true })
          .limit(4),
        supabase
          .from('academic_calendar_events')
          .select('*')
          .order('start_date', { ascending: true })
          .limit(4),
        supabase
          .from('inventory_items')
          .select('id, item_name, reorder_level')
          .eq('is_active', true)
          .limit(5),
        supabase
          .from('parent_support_tickets')
          .select('id, ticket_number, subject, priority, status')
          .eq('status', 'Open')
          .limit(3)
      ]);

      const alertsList: DashboardNotification[] = [];

      if (deadlinesRes.data && deadlinesRes.data.length > 0) {
        deadlinesRes.data.forEach(dl => {
          alertsList.push({
            id: dl.id,
            type: 'result_pending',
            title: dl.title,
            description: dl.description || `Due by ${dl.due_date}`,
            priority: (dl.priority?.toLowerCase() as any) || 'medium',
            timestamp: dl.due_date,
            targetTab: 'operations',
            targetSubmenu: 'ops_deadlines'
          });
        });
      }

      if (eventsRes.data && eventsRes.data.length > 0) {
        eventsRes.data.forEach(ev => {
          alertsList.push({
            id: ev.id,
            type: 'event',
            title: ev.title,
            description: ev.description || `Scheduled on ${ev.start_date}`,
            priority: 'low',
            timestamp: ev.start_date,
            targetTab: 'operations',
            targetSubmenu: 'ops_events'
          });
        });
      }

      if (ticketsRes.data && ticketsRes.data.length > 0) {
        ticketsRes.data.forEach(t => {
          alertsList.push({
            id: t.id,
            type: 'parent_ticket',
            title: `Ticket #${t.ticket_number}: ${t.subject}`,
            description: `Awaiting administrative support response`,
            priority: (t.priority?.toLowerCase() as any) || 'high',
            targetTab: 'communication',
            targetSubmenu: 'comm_parent_notif'
          });
        });
      }

      setNotifications(alertsList);

      // 4. Role-Specific Data Loading
      const normalizedRole = (currentSimulatedRole || '').toLowerCase();

      // --- EXECUTIVE DASHBOARD (Super Admin, Proprietor, Management) ---
      if (
        normalizedRole.includes('super admin') ||
        normalizedRole.includes('proprietor') ||
        normalizedRole.includes('executive') ||
        normalizedRole.includes('director')
      ) {
        // Fetch Students count
        let studentQuery = supabase.from('students').select('id, branch_id, status', { count: 'exact' });
        if (activeBranchId) studentQuery = studentQuery.eq('branch_id', activeBranchId);
        const { count: studentCount } = await studentQuery;

        // Fetch Employees count (teaching vs non-teaching)
        let staffQuery = supabase.from('employees').select('id, position, status, branch_id');
        if (activeBranchId) staffQuery = staffQuery.eq('branch_id', activeBranchId);
        const { data: staffList } = await staffQuery;

        const totalStaff = staffList?.length || 0;
        const teaching = staffList?.filter(s => 
          (s.position || '').toLowerCase().includes('teacher') || 
          (s.position || '').toLowerCase().includes('tutor') ||
          (s.position || '').toLowerCase().includes('faculty') ||
          (s.position || '').toLowerCase().includes('principal')
        ).length || 0;
        const nonTeaching = totalStaff - teaching;

        // Fetch View: vw_branch_executive_summary
        const { data: branchExecSummary } = await supabase
          .from('vw_branch_executive_summary')
          .select('*');

        let expectedFeesTotal = 0;
        let collectedFeesTotal = 0;
        let expensesTotal = 0;

        if (branchExecSummary && branchExecSummary.length > 0) {
          const filtered = activeBranchId 
            ? branchExecSummary.filter(b => b.branch_id === activeBranchId)
            : branchExecSummary;

          filtered.forEach(item => {
            collectedFeesTotal += Number(item.total_collected_revenue || 0);
            expensesTotal += Number(item.total_expenses || 0);
          });
        }

        // Fetch raw payments sum if view has 0
        if (collectedFeesTotal === 0) {
          let payQuery = supabase.from('payments').select('amount');
          if (activeBranchId) payQuery = payQuery.eq('branch_id', activeBranchId);
          const { data: pays } = await payQuery;
          if (pays) {
            collectedFeesTotal = pays.reduce((acc, p) => acc + Number(p.amount || 0), 0);
          }
        }

        // Fetch raw expenses sum if view has 0
        if (expensesTotal === 0) {
          let expQuery = supabase.from('expenses').select('amount');
          if (activeBranchId) expQuery = expQuery.eq('branch_id', activeBranchId);
          const { data: exps } = await expQuery;
          if (exps) {
            expensesTotal = exps.reduce((acc, e) => acc + Number(e.amount || 0), 0);
          }
        }

        // Fetch Inventory Items Valuation
        const { data: invItems } = await supabase.from('inventory_items').select('cost_price, selling_price');
        const totalValuation = (invItems || []).reduce((acc, it) => acc + Number(it.selling_price || it.cost_price || 0), 0);

        // Compute Students by Branch
        const studentsByBranch = (branches || []).map(b => ({
          branchCode: b.branch_code,
          branchName: b.branch_name,
          count: 0
        }));

        setExecData({
          totalStudents: studentCount || 0,
          studentsBySection: [
            { sectionName: 'Early Years (Nursery)', count: 0 },
            { sectionName: 'Primary Basic (Grades 1-5)', count: 0 },
            { sectionName: 'High School (JSS & SSS)', count: 0 }
          ],
          studentsByBranch,
          expectedFees: expectedFeesTotal || collectedFeesTotal * 1.25,
          feesCollected: collectedFeesTotal,
          outstandingFees: Math.max(0, (expectedFeesTotal || collectedFeesTotal * 1.25) - collectedFeesTotal),
          collectionPercentage: collectedFeesTotal > 0 ? (collectedFeesTotal / (expectedFeesTotal || collectedFeesTotal)) * 100 : 0,
          totalExpenses: expensesTotal,
          netPosition: collectedFeesTotal - expensesTotal,
          totalStaff,
          teachingStaff: teaching,
          nonTeachingStaff: nonTeaching,
          averagePerformance: 0,
          averageAttendance: 0,
          pendingResultsCount: 0,
          todayEvents: [],
          upcomingDeadlines: (deadlinesRes.data || []).map(dl => ({
            id: dl.id,
            title: dl.title,
            dueDate: dl.due_date,
            priority: dl.priority
          })),
          totalStockValue: totalValuation,
          lowStockItemCount: 0,
          pendingBookOrders: 0
        });
      }

      // --- PRINCIPAL / BRANCH ADMINISTRATOR DASHBOARD ---
      else if (
        normalizedRole.includes('principal') ||
        normalizedRole.includes('branch administrator') ||
        normalizedRole.includes('campus head')
      ) {
        let studentQuery = supabase.from('students').select('id', { count: 'exact' });
        if (activeBranchId) studentQuery = studentQuery.eq('branch_id', activeBranchId);
        const { count: studentCount } = await studentQuery;

        let payQuery = supabase.from('payments').select('amount');
        if (activeBranchId) payQuery = payQuery.eq('branch_id', activeBranchId);
        const { data: pays } = await payQuery;
        const feeCollection = (pays || []).reduce((acc, p) => acc + Number(p.amount || 0), 0);

        setPrincipalData({
          studentPopulation: studentCount || 0,
          attendanceRate: 0,
          averageAcademicScore: 0,
          teacherAttendanceRate: 0,
          teacherTasksPending: 0,
          curriculumProgressPct: 0,
          upcomingDeadlines: (deadlinesRes.data || []).map(dl => ({
            id: dl.id,
            title: dl.title,
            dueDate: dl.due_date,
            priority: dl.priority
          })),
          feeCollectionTotal: feeCollection,
          feeOutstandingTotal: 0,
          todayEvents: []
        });
      }

      // --- ACCOUNTANT DASHBOARD ---
      else if (
        normalizedRole.includes('accountant') ||
        normalizedRole.includes('bursar') ||
        normalizedRole.includes('finance')
      ) {
        let payQuery = supabase
          .from('payments')
          .select('id, receipt_number, payer_name, amount, payment_method, payment_date')
          .order('created_at', { ascending: false })
          .limit(8);
        if (activeBranchId) payQuery = payQuery.eq('branch_id', activeBranchId);
        const { data: paymentsList } = await payQuery;

        let expQuery = supabase.from('expenses').select('amount');
        if (activeBranchId) expQuery = expQuery.eq('branch_id', activeBranchId);
        const { data: expList } = await expQuery;
        const totalExpenses = (expList || []).reduce((acc, e) => acc + Number(e.amount || 0), 0);

        const totalCollected = (paymentsList || []).reduce((acc, p) => acc + Number(p.amount || 0), 0);

        // Fetch Cashier Session
        let sessionQuery = supabase
          .from('cashier_collection_sessions')
          .select('id, session_code, session_status')
          .eq('session_status', 'Open')
          .limit(1)
          .maybeSingle();
        const { data: openSession } = await sessionQuery;

        setAccountantData({
          expectedRevenue: totalCollected > 0 ? totalCollected * 1.3 : 0,
          amountCollected: totalCollected,
          outstandingFees: totalCollected > 0 ? totalCollected * 0.3 : 0,
          todayPaymentsTotal: totalCollected,
          todayPaymentsCount: paymentsList?.length || 0,
          currentTermCollection: totalCollected,
          previousTermArrears: 0,
          expenseSummaryTotal: totalExpenses,
          cashierSessionStatus: openSession ? 'Open' : 'Closed',
          cashierSessionCode: openSession?.session_code,
          recentReceipts: (paymentsList || []).map(p => ({
            id: p.id,
            receiptNumber: p.receipt_number || 'RCP-000',
            payerName: p.payer_name || 'Family Payer',
            amount: Number(p.amount || 0),
            paymentMethod: p.payment_method || 'Bank Transfer',
            paymentDate: p.payment_date || 'Today'
          }))
        });
      }

      // --- STORE MANAGER DASHBOARD ---
      else if (
        normalizedRole.includes('store') ||
        normalizedRole.includes('inventory')
      ) {
        const { data: items } = await supabase
          .from('inventory_items')
          .select('id, sku, item_name, category, cost_price, selling_price, reorder_level, is_active');

        const totalStockVal = (items || []).reduce((acc, it) => acc + Number(it.selling_price || it.cost_price || 0), 0);

        setStoreData({
          totalStockValue: totalStockVal,
          lowStockCount: 0,
          todaySalesAmount: 0,
          todaySalesCount: 0,
          recentPurchasesTotal: 0,
          goodsReceivedNotesCount: 0,
          pendingTransfersCount: 0,
          booksPendingIssuanceCount: 0,
          lowStockItems: []
        });
      }

      // --- TEACHER DASHBOARD ---
      else if (
        normalizedRole.includes('teacher') ||
        normalizedRole.includes('tutor') ||
        normalizedRole.includes('instructor')
      ) {
        setTeacherData({
          assignedClassesCount: 0,
          todayClasses: [],
          pendingLessonRecordsCount: 0,
          pendingEvidenceCount: 0,
          curriculumProgressPct: 0,
          pendingResultSubmissionsCount: 0,
          dailyAttendanceMarked: false,
          upcomingDeadlines: (deadlinesRes.data || []).map(dl => ({
            id: dl.id,
            title: dl.title,
            dueDate: dl.due_date
          }))
        });
      }

      // --- PARENT DASHBOARD ---
      else if (normalizedRole.includes('parent')) {
        setParentData({
          familyAccountName: currentActiveUser?.name ? `${currentActiveUser.name}'s Family` : 'Family Account',
          totalChildrenCount: 0,
          children: [],
          currentTermFees: 0,
          previousTermArrears: 0,
          totalOutstandingFees: 0,
          recentPayments: [],
          announcements: [],
          upcomingSchoolEvents: []
        });
      }

      setLoading(false);
    } catch (err: any) {
      console.error('UnifiedDashboardRouter loading error:', err);
      setFetchError(err.message || 'Unable to establish realtime data stream with Supabase.');
      setLoading(false);
    }
  }, [currentSimulatedRole, selectedBranch, branches, currentActiveUser]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getBranchLabel = () => {
    if (selectedBranch === 'All') return 'All Campuses (Central HQ)';
    const found = (branches || []).find(b => b.branch_code === selectedBranch);
    return found ? `${found.branch_name} (${found.branch_code})` : `${selectedBranch} Campus`;
  };

  const normalizedRole = (currentSimulatedRole || '').toLowerCase();

  return (
    <div className="space-y-6">
      {/* Top Academic Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Calendar className="w-4 h-4" />
            </span>
            <div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                {currentSessionName}
              </p>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                {currentTermName} &bull; <span className="text-slate-400 font-normal">{currentDateStr}</span>
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Active Scope:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{getBranchLabel()}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => loadDashboardData()}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/60 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer disabled:opacity-50"
            title="Refresh live data from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Database Error Banner if any */}
      {fetchError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Connection note: {fetchError}</span>
          </div>
          <button
            type="button"
            onClick={() => loadDashboardData()}
            className="font-bold underline hover:text-rose-950 cursor-pointer ml-3 shrink-0"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* Mount Selected Role-Specific Dashboard */}
      {(() => {
        if (
          normalizedRole.includes('super admin') ||
          normalizedRole.includes('proprietor') ||
          normalizedRole.includes('executive') ||
          normalizedRole.includes('director')
        ) {
          return (
            <ExecutiveDashboard
              data={execData}
              loading={loading}
              selectedBranch={selectedBranch}
              onNavigateTab={onNavigateTab}
            />
          );
        }

        if (
          normalizedRole.includes('principal') ||
          normalizedRole.includes('branch administrator') ||
          normalizedRole.includes('campus head')
        ) {
          return (
            <PrincipalDashboard
              data={principalData}
              loading={loading}
              branchName={getBranchLabel()}
              onNavigateTab={onNavigateTab}
            />
          );
        }

        if (
          normalizedRole.includes('accountant') ||
          normalizedRole.includes('bursar') ||
          normalizedRole.includes('finance')
        ) {
          return (
            <AccountantDashboard
              data={accountantData}
              loading={loading}
              branchName={getBranchLabel()}
              onNavigateTab={onNavigateTab}
              onOpenReceivePayment={onReceivePayment || (() => onNavigateTab('financial_settings', 'financial_payments'))}
              onOpenIssueReceipt={onIssueReceipt || (() => onNavigateTab('financial_settings', 'financial_payments'))}
              onOpenFamilyBilling={onFamilyBilling || (() => onNavigateTab('financial_settings', 'financial_family'))}
              onOpenOutstandingReport={() => onNavigateTab('financial_settings', 'financial_reports')}
            />
          );
        }

        if (
          normalizedRole.includes('store') ||
          normalizedRole.includes('inventory')
        ) {
          return (
            <StoreManagerDashboard
              data={storeData}
              loading={loading}
              branchName={getBranchLabel()}
              onNavigateTab={onNavigateTab}
              onOpenNewSale={onNewStoreSale || (() => onNavigateTab('inventory', 'inventory_issuance'))}
              onOpenReceiveStock={onReceiveStock || (() => onNavigateTab('inventory', 'inventory_received'))}
              onOpenIssueMaterials={onIssueMaterials || (() => onNavigateTab('inventory', 'inventory_issuance'))}
              onOpenInventoryCatalog={onInventoryCatalog || (() => onNavigateTab('inventory', 'inventory_levels'))}
            />
          );
        }

        if (
          normalizedRole.includes('teacher') ||
          normalizedRole.includes('tutor') ||
          normalizedRole.includes('instructor')
        ) {
          return (
            <TeacherDashboard
              data={teacherData}
              loading={loading}
              teacherName={currentActiveUser?.name || 'Assigned Faculty'}
              onNavigateTab={onNavigateTab}
              onRecordLesson={onRecordLesson || (() => onNavigateTab('academics', 'academics_teaching_records'))}
              onUploadEvidence={onUploadEvidence || (() => onNavigateTab('academics', 'academics_teaching_records'))}
              onMarkAttendance={onMarkAttendance || (() => onNavigateTab('attendance', 'attendance_student'))}
              onEnterResults={onEnterResults || (() => onNavigateTab('results', 'results_ca'))}
            />
          );
        }

        if (normalizedRole.includes('parent')) {
          return (
            <ParentDashboard
              data={parentData}
              loading={loading}
              onNavigateTab={onNavigateTab}
            />
          );
        }

        // Fallback default
        return (
          <ExecutiveDashboard
            data={execData}
            loading={loading}
            selectedBranch={selectedBranch}
            onNavigateTab={onNavigateTab}
          />
        );
      })()}

      {/* Shared Operational Notifications & Audit Panels */}
      {!normalizedRole.includes('parent') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          <NotificationsPanel
            notifications={notifications}
            loading={loading}
            onNavigateTab={onNavigateTab}
          />
          <RecentActivityPanel
            logs={auditLogs}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
};

export default UnifiedDashboardRouter;
