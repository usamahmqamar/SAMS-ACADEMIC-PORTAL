import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Zap,
  DollarSign,
  Search,
  Receipt,
  CheckSquare,
  FileSpreadsheet,
  Calendar,
  LayoutDashboard,
  ShieldCheck,
  ClipboardList,
  PackagePlus,
  Truck,
  ArrowRightLeft,
  UserPlus,
  UserCheck,
  BookOpen,
  Bell,
  Heart,
  X,
  Printer,
  Sparkles,
  Info
} from 'lucide-react';

interface QuickActionMenuProps {
  currentSimulatedRole?: string;
  currentUserRole?: string;
  setActiveTab: (tab: string) => void;
  setFinancialActiveSection?: (section: any) => void;
  onAddStudent?: () => void;
  onAddTeacher?: () => void;
}

export const QuickActionMenu: React.FC<QuickActionMenuProps> = ({
  currentSimulatedRole,
  currentUserRole,
  setActiveTab,
  setFinancialActiveSection,
  onAddStudent,
  onAddTeacher
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Authenticated Role
  const effectiveRole = currentUserRole || currentSimulatedRole || 'Admin';

  // Mini interactive state for payment collection
  const [collectFeeStudent, setCollectFeeStudent] = useState('Fatima Musa');
  const [collectFeeAmount, setCollectFeeAmount] = useState('45000');
  const [collectFeeMethod, setCollectFeeMethod] = useState('Bank Transfer');
  const [collectFeeSuccess, setCollectFeeSuccess] = useState(false);

  // Mini interactive state for results entry
  const [resultStudent, setResultStudent] = useState('Amina Bello');
  const [resultSubject, setResultSubject] = useState('Mathematics');
  const [resultCa, setResultCa] = useState('32');
  const [resultExam, setResultExam] = useState('54');
  const [resultSuccess, setResultSuccess] = useState(false);

  // Mini interactive state for attendance
  const [attendanceList, setAttendanceList] = useState([
    { id: 1, name: 'Amina Bello', status: 'Present' },
    { id: 2, name: 'Tariq Al-Mansur', status: 'Present' },
    { id: 3, name: 'Chinedu Okafor', status: 'Absent' },
    { id: 4, name: 'Zainab Musa', status: 'Present' },
    { id: 5, name: 'Khalid Ibrahim', status: 'Present' }
  ]);
  const [attendanceSuccess, setAttendanceSuccess] = useState(false);

  // Mini interactive state for inventory
  const [inventoryItem, setInventoryItem] = useState('Grade 10 Mathematics Standard Textbook');
  const [inventoryQty, setInventoryQty] = useState('15');
  const [inventoryReason, setInventoryReason] = useState('Store Restock');
  const [inventorySuccess, setInventorySuccess] = useState(false);

  // Mini interactive state for approvals
  const [pendingApprovals, setPendingApprovals] = useState([
    { id: 'app-1', title: 'Teacher Medical Leave', desc: 'Adeyemi T. (3 Days)', status: 'Pending' },
    { id: 'app-2', title: 'New Admissions Intake', desc: 'Amina Bello (Grade 10)', status: 'Pending' },
    { id: 'app-3', title: 'Grade Moderation Release', desc: 'Term 1 CA Review', status: 'Pending' }
  ]);

  const handleApprove = (id: string) => {
    setPendingApprovals(prev =>
      prev.map(app => (app.id === id ? { ...app, status: 'Approved' } : app))
    );
  };

  const handleReject = (id: string) => {
    setPendingApprovals(prev =>
      prev.map(app => (app.id === id ? { ...app, status: 'Rejected' } : app))
    );
  };

  const handleToggleAttendance = (id: number) => {
    setAttendanceList(prev =>
      prev.map(st => (st.id === id ? { ...st, status: st.status === 'Present' ? 'Absent' : 'Present' } : st))
    );
  };

  // Define role actions dynamically
  const getRoleActions = () => {
    const role = effectiveRole;

    if (role === 'Accountant') {
      return [
        {
          label: 'Collect Fee',
          icon: DollarSign,
          color: 'bg-emerald-500 hover:bg-emerald-600 text-white',
          onClick: () => {
            setActiveModal('collect_fee');
            setIsOpen(false);
          }
        },
        {
          label: 'Search Student',
          icon: Search,
          color: 'bg-indigo-500 hover:bg-indigo-600 text-white',
          onClick: () => {
            setActiveTab('students');
            setIsOpen(false);
          }
        },
        {
          label: 'Issue Receipt',
          icon: Receipt,
          color: 'bg-purple-500 hover:bg-purple-600 text-white',
          onClick: () => {
            if (setFinancialActiveSection) {
              setFinancialActiveSection('payment_collection');
            }
            setActiveTab('financial_settings');
            setActiveModal('collect_fee'); // Also trigger interactive receipt creator
            setIsOpen(false);
          }
        }
      ];
    }

    if (role === 'Teacher') {
      return [
        {
          label: 'Take Attendance',
          icon: CheckSquare,
          color: 'bg-amber-500 hover:bg-amber-600 text-white',
          onClick: () => {
            setActiveModal('take_attendance');
            setIsOpen(false);
          }
        },
        {
          label: 'Enter Results',
          icon: FileSpreadsheet,
          color: 'bg-indigo-500 hover:bg-indigo-600 text-white',
          onClick: () => {
            setActiveModal('enter_results');
            setIsOpen(false);
          }
        },
        {
          label: 'View Timetable',
          icon: Calendar,
          color: 'bg-sky-500 hover:bg-sky-600 text-white',
          onClick: () => {
            setActiveTab('scheduler');
            setIsOpen(false);
          }
        }
      ];
    }

    if (role.includes('Principal') || role === 'Proprietor' || role.includes('Admin')) {
      return [
        {
          label: 'Dashboard',
          icon: LayoutDashboard,
          color: 'bg-indigo-500 hover:bg-indigo-600 text-white',
          onClick: () => {
            setActiveTab('overview');
            setIsOpen(false);
          }
        },
        {
          label: 'Approvals Panel',
          icon: ShieldCheck,
          color: 'bg-rose-500 hover:bg-rose-600 text-white',
          onClick: () => {
            setActiveModal('approvals');
            setIsOpen(false);
          }
        },
        {
          label: "Today's Events",
          icon: Calendar,
          color: 'bg-emerald-500 hover:bg-emerald-600 text-white',
          onClick: () => {
            setActiveTab('calendar');
            setIsOpen(false);
          }
        }
      ];
    }

    if (role === 'Store Manager') {
      return [
        {
          label: 'Receive Stock',
          icon: PackagePlus,
          color: 'bg-indigo-500 hover:bg-indigo-600 text-white',
          onClick: () => {
            setInventoryReason('Store Restock');
            setActiveModal('update_inventory');
            setIsOpen(false);
          }
        },
        {
          label: 'Issue Materials',
          icon: Truck,
          color: 'bg-amber-500 hover:bg-amber-600 text-white',
          onClick: () => {
            setInventoryReason('Issue to Class');
            setActiveModal('update_inventory');
            setIsOpen(false);
          }
        },
        {
          label: 'Transfer Stock',
          icon: ArrowRightLeft,
          color: 'bg-sky-500 hover:bg-sky-600 text-white',
          onClick: () => {
            setInventoryReason('Inter-Branch Transfer');
            setActiveModal('update_inventory');
            setIsOpen(false);
          }
        }
      ];
    }

    if (role === 'Parent') {
      return [
        {
          label: 'Student Profile',
          icon: BookOpen,
          color: 'bg-indigo-500 hover:bg-indigo-600 text-white',
          onClick: () => {
            setActiveTab('parent');
            setIsOpen(false);
          }
        },
        {
          label: 'Pay Tuition Fee',
          icon: DollarSign,
          color: 'bg-emerald-500 hover:bg-emerald-600 text-white',
          onClick: () => {
            setActiveModal('collect_fee');
            setIsOpen(false);
          }
        },
        {
          label: 'View Notices',
          icon: Bell,
          color: 'bg-amber-500 hover:bg-amber-600 text-white',
          onClick: () => {
            setActiveTab('parent');
            setIsOpen(false);
          }
        }
      ];
    }

    // Default Fallback Actions for Super Admin / Super Administrator / others
    return [
      {
        label: 'Admit Student',
        icon: UserPlus,
        color: 'bg-emerald-500 hover:bg-emerald-600 text-white',
        onClick: () => {
          if (onAddStudent) onAddStudent();
          setActiveTab('students');
          setIsOpen(false);
        }
      },
      {
        label: 'Add Staff Member',
        icon: UserCheck,
        color: 'bg-indigo-500 hover:bg-indigo-600 text-white',
        onClick: () => {
          if (onAddTeacher) onAddTeacher();
          setActiveTab('teachers');
          setIsOpen(false);
        }
      },
      {
        label: 'Security Settings',
        icon: ShieldCheck,
        color: 'bg-rose-500 hover:bg-rose-600 text-white',
        onClick: () => {
          setActiveTab('security');
          setIsOpen(false);
        }
      }
    ];
  };

  const actions = getRoleActions();

  return (
    <>
      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isOpen && (
            <>
              {/* DESKTOP STAGGERED OVERLAY MENU */}
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.9 }}
                className="hidden md:flex flex-col space-y-2.5 mb-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-64 select-none"
              >
                <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      {effectiveRole} Actions
                    </span>
                  </div>
                  <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase">
                    Quick
                  </span>
                </div>

                {actions.map((act, idx) => {
                  const IconComp = act.icon;
                  return (
                    <button
                      key={idx}
                      onClick={act.onClick}
                      className="w-full flex items-center space-x-3 p-2 rounded-xl text-left text-xs font-semibold text-slate-700 hover:text-indigo-600 dark:text-slate-350 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-all cursor-pointer group"
                    >
                      <div className={`p-1.5 rounded-lg ${act.color} transition-transform group-hover:scale-110 shrink-0`}>
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{act.label}</span>
                    </button>
                  );
                })}
              </motion.div>

              {/* MOBILE BACKDROP FOR BOTTOM SHEET */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs md:hidden z-40"
              />

              {/* MOBILE BOTTOM SHEET DRAWER */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-6 md:hidden select-none pb-8"
              >
                {/* Drag Handle */}
                <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-5" />

                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        {effectiveRole} Workspace
                      </h4>
                      <p className="text-[9px] text-slate-400 font-medium">One-hand optimized quick access menu</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {actions.map((act, idx) => {
                    const IconComp = act.icon;
                    return (
                      <button
                        key={idx}
                        onClick={act.onClick}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/20 dark:hover:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 text-center transition-all cursor-pointer group"
                      >
                        <div className={`p-3 rounded-2xl ${act.color} mb-2 shadow-md shadow-indigo-650/10`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 leading-tight">
                          {act.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* FLOATING ACTION TRIGGER BUTTON */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`h-14 w-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer border-none outline-none ${
            isOpen
              ? 'bg-slate-900 rotate-45 hover:bg-slate-850 shadow-slate-900/10 dark:bg-slate-800'
              : 'bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-600/30'
          }`}
          title="SAMS Floating Quick Actions Menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6 animate-pulse" />}
        </button>
      </div>

      {/* ========================================================
         INTERACTIVE OVERLAY MODALS FOR QUICK ACTIONS
         ======================================================== */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setActiveModal(null);
                setCollectFeeSuccess(false);
                setResultSuccess(false);
                setAttendanceSuccess(false);
                setInventorySuccess(false);
              }}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden z-10 p-6 font-sans text-slate-800 dark:text-slate-200"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setActiveModal(null);
                  setCollectFeeSuccess(false);
                  setResultSuccess(false);
                  setAttendanceSuccess(false);
                  setInventorySuccess(false);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* MODAL CONTENT 1: COLLECT FEE */}
              {activeModal === 'collect_fee' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-950 dark:text-slate-100 uppercase tracking-wide">
                        Fee Receipt Collection desk
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium">Generate transaction receipts instantly</p>
                    </div>
                  </div>

                  {collectFeeSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-6 text-center space-y-4 bg-emerald-500/5 rounded-2xl border border-emerald-100 dark:border-emerald-950/20 p-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                        <Printer className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-emerald-800 dark:text-emerald-400">
                          Fee Receipt Issued Successfully!
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-1">
                          Payment ledger updated for student <span className="font-bold">{collectFeeStudent}</span>.
                          Standard receipt issued to parent email wallet.
                        </p>
                      </div>

                      {/* Mock Receipt Card */}
                      <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 p-3 rounded-xl text-left font-mono text-[9px] space-y-1.5 shadow-sm text-slate-600 dark:text-slate-450">
                        <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-800 pb-1.5">
                          <span className="font-black">SAMS OFFICIAL RECEIPT</span>
                          <span className="font-bold">#REC-26-4401</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Student:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{collectFeeStudent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Date/Time:</span>
                          <span>2026-07-19 (Live Sync)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Channel:</span>
                          <span className="uppercase font-bold">{collectFeeMethod}</span>
                        </div>
                        <div className="flex justify-between border-t border-dashed border-slate-200 dark:border-slate-800 pt-1.5 text-xs text-slate-850 dark:text-slate-250">
                          <span className="font-black">TOTAL PAID:</span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">
                            ₦{parseInt(collectFeeAmount).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCollectFeeSuccess(false)}
                          className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-350 font-bold text-xs cursor-pointer transition-colors"
                        >
                          Collect New Payment
                        </button>
                        <button
                          onClick={() => {
                            setActiveModal(null);
                            setCollectFeeSuccess(false);
                          }}
                          className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="space-y-3.5 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Select Registered Student
                        </label>
                        <select
                          value={collectFeeStudent}
                          onChange={(e) => setCollectFeeStudent(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 font-medium"
                        >
                          <option value="Fatima Musa">Fatima Musa (Primary 4B)</option>
                          <option value="Chinedu Okafor">Chinedu Okafor (Secondary 2)</option>
                          <option value="Tunde Balogun">Tunde Balogun (Nursery 1)</option>
                          <option value="Amina Bello">Amina Bello (Grade 10)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Amount (₦)
                          </label>
                          <input
                            type="number"
                            value={collectFeeAmount}
                            onChange={(e) => setCollectFeeAmount(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 font-mono font-bold"
                            placeholder="Amount in Naira"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Payment Method
                          </label>
                          <select
                            value={collectFeeMethod}
                            onChange={(e) => setCollectFeeMethod(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 font-medium"
                          >
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cash Entry">Cash Entry</option>
                            <option value="POS / Card">POS / Card</option>
                            <option value="Scholarship Key">Scholarship Key</option>
                          </select>
                        </div>
                      </div>

                      <div className="p-3 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/30 dark:border-indigo-900/20 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 leading-normal flex items-start space-x-2">
                        <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <span>
                          This ledger ingestion locks the cash account, triggers an automated reconciliation record, and auto-notifies the school's general ledger of cashflow changes.
                        </span>
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <button
                          onClick={() => {
                            setActiveModal(null);
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-350 font-bold transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (!collectFeeAmount || parseInt(collectFeeAmount) <= 0) {
                              alert('Please enter a valid amount.');
                              return;
                            }
                            setCollectFeeSuccess(true);
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all cursor-pointer shadow-md shadow-emerald-550/10"
                        >
                          Confirm &amp; Issue Receipt
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODAL CONTENT 2: TAKE ATTENDANCE */}
              {activeModal === 'take_attendance' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-950 dark:text-slate-100 uppercase tracking-wide">
                        Daily Classroom Register
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium">Take morning attendance roll call</p>
                    </div>
                  </div>

                  {attendanceSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-6 text-center space-y-4 bg-emerald-500/5 rounded-2xl border border-emerald-100 dark:border-emerald-950/20 p-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
                        <UserCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-emerald-800 dark:text-emerald-400">
                          Attendance Logged Successfully!
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-1">
                          Class registry updated for today. Absence SMS triggers dispatched for absent students ({attendanceList.filter(s => s.status === 'Absent').length} total).
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setActiveModal(null);
                          setAttendanceSuccess(false);
                        }}
                        className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer transition-colors"
                      >
                        Great, Back to Workspace
                      </button>
                    </motion.div>
                  ) : (
                    <div className="space-y-4 text-xs">
                      <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-150 dark:border-slate-850/60 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <span>Class: Grade 10 A (Science)</span>
                        <span className="font-mono text-slate-700 dark:text-slate-350">July 19, 2026</span>
                      </div>

                      <div className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-thin">
                        {attendanceList.map(st => (
                          <div
                            key={st.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 hover:bg-slate-50 transition-colors"
                          >
                            <span className="font-extrabold text-slate-850 dark:text-slate-200">{st.name}</span>
                            <button
                              onClick={() => handleToggleAttendance(st.id)}
                              className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                                st.status === 'Present'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200'
                                  : 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border border-rose-200'
                              }`}
                            >
                              {st.status}
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <button
                          onClick={() => {
                            setActiveModal(null);
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-bold transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setAttendanceSuccess(true);
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all cursor-pointer shadow-md shadow-indigo-100"
                        >
                          Submit Register
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODAL CONTENT 3: ENTER RESULTS */}
              {activeModal === 'enter_results' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-950 dark:text-slate-100 uppercase tracking-wide">
                        Continuous Assessment Grade Entry
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium">Record term-level grades for subject classes</p>
                    </div>
                  </div>

                  {resultSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-6 text-center space-y-4 bg-emerald-500/5 rounded-2xl border border-emerald-100 dark:border-emerald-950/20 p-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-emerald-800 dark:text-emerald-400">
                          Grades Logged &amp; Published!
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-1">
                          The system auto-tallied continuous assessment scores and generated the matching report card ledger entries successfully.
                        </p>
                      </div>

                      {/* Grade Mock Summary */}
                      <div className="p-3.5 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl text-left space-y-1 shadow-sm text-[10px]">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{resultStudent} • {resultSubject}</p>
                        <p className="text-slate-500">CA Quiz: <span className="font-mono text-slate-850 dark:text-slate-200">{resultCa}/40</span></p>
                        <p className="text-slate-500">Term Final: <span className="font-mono text-slate-850 dark:text-slate-200">{resultExam}/60</span></p>
                        <p className="text-slate-500">Sum Total: <span className="font-black text-indigo-600 dark:text-indigo-400">{parseInt(resultCa) + parseInt(resultExam)}/100</span></p>
                        <p className="text-slate-500">Auto Grade: <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-black font-mono text-[9px]">
                          {parseInt(resultCa) + parseInt(resultExam) >= 80 ? 'A (Excellent)' :
                           parseInt(resultCa) + parseInt(resultExam) >= 65 ? 'B (Very Good)' :
                           parseInt(resultCa) + parseInt(resultExam) >= 50 ? 'C (Credit)' : 'F (Needs Improvement)'}
                        </span></p>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => setResultSuccess(false)}
                          className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-350 font-bold text-xs cursor-pointer transition-colors"
                        >
                          Enter Another Mark
                        </button>
                        <button
                          onClick={() => {
                            setActiveModal(null);
                            setResultSuccess(false);
                          }}
                          className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="space-y-3.5 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Choose Student
                          </label>
                          <select
                            value={resultStudent}
                            onChange={(e) => setResultStudent(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 font-medium"
                          >
                            <option value="Amina Bello">Amina Bello (Grade 10)</option>
                            <option value="Khalid Ibrahim">Khalid Ibrahim (Grade 10)</option>
                            <option value="Zainab Musa">Zainab Musa (Grade 10)</option>
                            <option value="Tariq Al-Mansur">Tariq Al-Mansur (Grade 10)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Active Subject
                          </label>
                          <select
                            value={resultSubject}
                            onChange={(e) => setResultSubject(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 font-medium"
                          >
                            <option value="Mathematics">Mathematics</option>
                            <option value="Physics">Physics</option>
                            <option value="Chemistry">Chemistry</option>
                            <option value="English Literature">English Literature</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Continuous Assessment (Max: 40)
                          </label>
                          <input
                            type="number"
                            value={resultCa}
                            onChange={(e) => setResultCa(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 font-mono font-bold"
                            max={40}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Examination Score (Max: 60)
                          </label>
                          <input
                            type="number"
                            value={resultExam}
                            onChange={(e) => setResultExam(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 font-mono font-bold"
                            max={60}
                          />
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <button
                          onClick={() => {
                            setActiveModal(null);
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-bold transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            const caVal = parseInt(resultCa);
                            const examVal = parseInt(resultExam);
                            if (isNaN(caVal) || caVal < 0 || caVal > 40 || isNaN(examVal) || examVal < 0 || examVal > 60) {
                              alert('Please verify marks comply with boundaries (CA max 40, Exam max 60).');
                              return;
                            }
                            setResultSuccess(true);
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all cursor-pointer shadow-md shadow-indigo-100"
                        >
                          Upload Marks
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODAL CONTENT 4: UPDATE INVENTORY (Store Manager) */}
              {activeModal === 'update_inventory' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                      <PackagePlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-950 dark:text-slate-100 uppercase tracking-wide">
                        {inventoryReason} Ledger
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium">Log stock increases, issuances and movements</p>
                    </div>
                  </div>

                  {inventorySuccess ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-6 text-center space-y-4 bg-emerald-500/5 rounded-2xl border border-emerald-100 dark:border-emerald-950/20 p-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
                        <CheckSquare className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-emerald-800 dark:text-emerald-400">
                          Stock Logs Updated Successfully!
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-1">
                          Supplies Ledger updated. <span className="font-bold">{inventoryQty} units</span> of <span className="font-bold">{inventoryItem}</span> saved under transaction rule <span className="uppercase font-mono text-emerald-600">{inventoryReason}</span>.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setActiveModal(null);
                          setInventorySuccess(false);
                        }}
                        className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer transition-colors"
                      >
                        Back to Stock Control
                      </button>
                    </motion.div>
                  ) : (
                    <div className="space-y-3.5 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Select Resource Item
                        </label>
                        <select
                          value={inventoryItem}
                          onChange={(e) => setInventoryItem(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 font-medium"
                        >
                          <option value="Grade 10 Mathematics Standard Textbook">Mathematics Textbook (Standard 10)</option>
                          <option value="Introductory Chemistry Kit (Lab Set)">Introductory Chemistry Kit (Lab Set)</option>
                          <option value="SAMS Custom Embossed Notebook (Pack of 50)">Custom Notebooks (Pack of 50)</option>
                          <option value="Secondary School Blazer (Navy, Medium)">School Blazer Navy (Medium)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Quantity Change
                          </label>
                          <input
                            type="number"
                            value={inventoryQty}
                            onChange={(e) => setInventoryQty(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 font-mono font-bold"
                            placeholder="Units"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Transaction Rule
                          </label>
                          <select
                            value={inventoryReason}
                            onChange={(e) => setInventoryReason(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 font-medium"
                          >
                            <option value="Store Restock">Store Restock (Add)</option>
                            <option value="Issue to Class">Issue to Class (Reduce)</option>
                            <option value="Inter-Branch Transfer">Inter-Branch Transfer (Move)</option>
                            <option value="Damage / Loss Write-Off">Damage / Loss Write-Off</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <button
                          onClick={() => {
                            setActiveModal(null);
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-bold transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            const qty = parseInt(inventoryQty);
                            if (isNaN(qty) || qty <= 0) {
                              alert('Please specify a positive unit quantity.');
                              return;
                            }
                            setInventorySuccess(true);
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all cursor-pointer shadow-md shadow-indigo-100"
                        >
                          Submit Log Entry
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODAL CONTENT 5: APPROVALS CENTRE (Principal / Admin) */}
              {activeModal === 'approvals' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-950 dark:text-slate-100 uppercase tracking-wide">
                        SAMS Institutional Approvals Centre
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium">Verify pending administrative and academic actions</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {pendingApprovals.map(app => (
                      <div
                        key={app.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all"
                      >
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-slate-850 dark:text-slate-200">{app.title}</p>
                          <p className="text-[10px] text-slate-500 leading-normal font-medium mt-0.5">{app.desc}</p>
                        </div>

                        {app.status === 'Pending' ? (
                          <div className="flex space-x-1.5 self-end sm:self-center shrink-0">
                            <button
                              onClick={() => handleReject(app.id)}
                              className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-400 font-bold text-[10px] uppercase cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApprove(app.id)}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase cursor-pointer shadow-sm"
                            >
                              Approve
                            </button>
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider self-end sm:self-center shrink-0 ${
                            app.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200'
                          }`}>
                            {app.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setActiveModal(null);
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-bold text-xs cursor-pointer transition-colors"
                    >
                      Done, Close Centre
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
