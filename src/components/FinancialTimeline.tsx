import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Search, 
  Filter, 
  User, 
  Users, 
  PlusCircle, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  FileText, 
  Tag, 
  Award, 
  BookOpen, 
  AlertTriangle, 
  DollarSign, 
  FileCheck, 
  Activity,
  History,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: 'Fee Generated' | 'Payment' | 'Receipt' | 'Books Issued' | 'Discount' | 'Scholarship' | 'Carry Forward' | 'Refund' | 'Restriction';
  date: string;
  amount?: number;
  studentId?: string;
  studentName?: string;
  familyAccountId?: string;
  familyCode?: string;
  referenceNo?: string;
  description: string;
  status?: string;
  meta?: Record<string, any>;
}

interface Student {
  id: string;
  name: string;
  grade?: string;
}

interface Family {
  id: string;
  familyName: string;
  primaryParentName: string;
}

export default function FinancialTimeline() {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active View Tab: 'chronological' | 'student' | 'family'
  const [activeView, setActiveView] = useState<'chronological' | 'student' | 'family'>('chronological');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');

  // Form states for "Generate Simulated Event"
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [genType, setGenType] = useState<TimelineEvent['type']>('Fee Generated');
  const [genStudentId, setGenStudentId] = useState('');
  const [genFamilyId, setGenFamilyId] = useState('');
  const [genAmount, setGenAmount] = useState('');
  const [genDescription, setGenDescription] = useState('');
  const [genRefNo, setGenRefNo] = useState('');
  const [genStatus, setGenStatus] = useState('');
  const [genDate, setGenDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const fetchTimeline = async () => {
    try {
      const res = await fetch('/api/financial_timeline');
      if (res.ok) {
        const data = await res.json();
        setTimeline(data);
      }
    } catch (e) {
      console.error("Error fetching financial timeline:", e);
    }
  };

  const fetchStudentsAndFamilies = async () => {
    try {
      const [resStd, resFam] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/family_accounts')
      ]);
      if (resStd.ok) {
        const data = await resStd.json();
        setStudents(data);
      }
      if (resFam.ok) {
        const data = await resFam.json();
        setFamilies(data);
      }
    } catch (e) {
      console.error("Error fetching dependencies:", e);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchTimeline(), fetchStudentsAndFamilies()]);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTimeline();
    setRefreshing(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Pre-fill fields when generator type changes
  useEffect(() => {
    if (genType === 'Fee Generated') {
      setGenDescription('Term fee invoice generated for classroom curriculum tuition & utilities levy.');
      setGenStatus('Unpaid');
      setGenRefNo(`INV-${Math.floor(Math.random() * 90000 + 10000)}`);
    } else if (genType === 'Payment') {
      setGenDescription('Partial transaction settlement received.');
      setGenStatus('Settled');
      setGenRefNo(`TXN-${Math.floor(Math.random() * 90000 + 10000)}`);
    } else if (genType === 'Receipt') {
      setGenDescription('Official institutional paperless receipt printed.');
      setGenStatus('Generated');
      setGenRefNo(`REC-${Math.floor(Math.random() * 90000 + 10000)}`);
    } else if (genType === 'Books Issued') {
      setGenDescription('Required term textbooks and reference modules checked out from standard stock.');
      setGenStatus('Issued');
      setGenRefNo(`BK-${Math.floor(Math.random() * 90000 + 10000)}`);
    } else if (genType === 'Discount') {
      setGenDescription('Early-bird administrative credit concession applied.');
      setGenStatus('Applied');
      setGenRefNo(`DSC-${Math.floor(Math.random() * 90000 + 10000)}`);
    } else if (genType === 'Scholarship') {
      setGenDescription('Academic merit scholarship tuition waiver applied.');
      setGenStatus('Applied');
      setGenRefNo(`SCH-${Math.floor(Math.random() * 90000 + 10000)}`);
    } else if (genType === 'Carry Forward') {
      setGenDescription('Carry forward transition of historical unpaid ledger balances.');
      setGenStatus('Unpaid');
      setGenRefNo(`CF-${Math.floor(Math.random() * 90000 + 10000)}`);
    } else if (genType === 'Refund') {
      setGenDescription('Disbursement refund processed for credit surplus.');
      setGenStatus('Completed');
      setGenRefNo(`RFD-${Math.floor(Math.random() * 90000 + 10000)}`);
    } else if (genType === 'Restriction') {
      setGenDescription('Institutional access block triggered due to outstanding past-due accounts.');
      setGenStatus('Active');
      setGenRefNo(`RST-LOCKED`);
    }
  }, [genType]);

  const handleGenerateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genDescription) return;

    setSubmitting(true);
    try {
      const payload = {
        type: genType,
        date: new Date(genDate).toISOString(),
        amount: genAmount ? parseFloat(genAmount) : undefined,
        studentId: genStudentId || undefined,
        familyAccountId: genFamilyId || undefined,
        referenceNo: genRefNo || undefined,
        description: genDescription,
        status: genStatus || undefined
      };

      const res = await fetch('/api/financial_timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchTimeline();
        setShowGeneratorModal(false);
        // Clear gen specific states
        setGenAmount('');
        setGenStudentId('');
        setGenFamilyId('');
      } else {
        alert("Failed to emit simulated timeline event.");
      }
    } catch (err) {
      console.error("Error creating timeline event:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter logic
  const filteredEvents = timeline.filter(evt => {
    // 1. Search text query
    const textMatch = searchQuery === '' || 
      evt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.referenceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.familyCode?.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Type filter
    const typeMatch = selectedType === 'all' || evt.type === selectedType;

    // 3. View context filters
    if (activeView === 'student') {
      return textMatch && typeMatch && evt.studentId === selectedStudentId;
    }
    if (activeView === 'family') {
      return textMatch && typeMatch && evt.familyAccountId === selectedFamilyId;
    }

    return textMatch && typeMatch;
  });

  // Get specific styles for each event type
  const getEventBadgeStyle = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'Fee Generated':
        return {
          bg: 'bg-slate-100 border-slate-200 text-slate-900',
          dot: 'bg-slate-900',
          icon: <FileText className="w-3.5 h-3.5" />
        };
      case 'Payment':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          dot: 'bg-emerald-500',
          icon: <ArrowDownLeft className="w-3.5 h-3.5" />
        };
      case 'Receipt':
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-800',
          dot: 'bg-blue-500',
          icon: <FileCheck className="w-3.5 h-3.5" />
        };
      case 'Books Issued':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          dot: 'bg-amber-500',
          icon: <BookOpen className="w-3.5 h-3.5" />
        };
      case 'Discount':
        return {
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
          dot: 'bg-indigo-500',
          icon: <Tag className="w-3.5 h-3.5" />
        };
      case 'Scholarship':
        return {
          bg: 'bg-purple-50 border-purple-200 text-purple-800',
          dot: 'bg-purple-500',
          icon: <Award className="w-3.5 h-3.5" />
        };
      case 'Carry Forward':
        return {
          bg: 'bg-orange-50 border-orange-200 text-orange-800',
          dot: 'bg-orange-500',
          icon: <History className="w-3.5 h-3.5" />
        };
      case 'Refund':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          dot: 'bg-rose-500',
          icon: <ArrowUpRight className="w-3.5 h-3.5" />
        };
      case 'Restriction':
        return {
          bg: 'bg-rose-100 border-rose-300 text-rose-950 font-bold',
          dot: 'bg-rose-700 animate-pulse',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
        };
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Institutional Financial Timeline</h2>
          </div>
          <p className="text-xs text-slate-500 leading-normal">
            Real-time auditable ledger logging. Tracking every fee invocation, scholarship grant, material issuance, and cash collection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh History Logs"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => {
              // Pre-fill some defaults
              if (students.length > 0) setGenStudentId(students[0].id);
              if (families.length > 0) setGenFamilyId(families[0].id);
              setShowGeneratorModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-3.5 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Generate Simulated Event</span>
          </button>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/80 p-1.5 rounded-2xl border border-slate-200/60 text-xs">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => {
              setActiveView('chronological');
              setSelectedStudentId('');
              setSelectedFamilyId('');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeView === 'chronological'
                ? 'bg-white text-slate-950 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📅 Chronological View
          </button>
          
          <button
            onClick={() => {
              setActiveView('student');
              if (students.length > 0 && !selectedStudentId) {
                setSelectedStudentId(students[0].id);
              }
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeView === 'student'
                ? 'bg-white text-slate-950 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🎓 Student Timeline
          </button>

          <button
            onClick={() => {
              setActiveView('family');
              if (families.length > 0 && !selectedFamilyId) {
                setSelectedFamilyId(families[0].id);
              }
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeView === 'family'
                ? 'bg-white text-slate-950 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            👨‍👩‍👧 Family Timeline
          </button>
        </div>

        {/* Dynamic Context Selector for Student or Family */}
        {activeView === 'student' && (
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="font-semibold text-slate-500 text-[11px]">Select Ward:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer max-w-xs"
            >
              <option value="">-- Choose Student --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.grade || 'Primary'})
                </option>
              ))}
            </select>
          </div>
        )}

        {activeView === 'family' && (
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="font-semibold text-slate-500 text-[11px]">Select Account:</span>
            <select
              value={selectedFamilyId}
              onChange={(e) => setSelectedFamilyId(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer max-w-xs"
            >
              <option value="">-- Choose Family --</option>
              {families.map(f => (
                <option key={f.id} value={f.id}>
                  {f.familyName} ({f.primaryParentName})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search descriptions, refs, student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-medium placeholder-slate-400"
          />
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-700 cursor-pointer"
          >
            <option value="all">All Event Types</option>
            <option value="Fee Generated">Fee Generated</option>
            <option value="Payment">Payment</option>
            <option value="Receipt">Receipt</option>
            <option value="Books Issued">Books Issued</option>
            <option value="Discount">Discount</option>
            <option value="Scholarship">Scholarship</option>
            <option value="Carry Forward">Carry Forward</option>
            <option value="Refund">Refund</option>
            <option value="Restriction">Restriction</option>
          </select>
        </div>

        <div className="bg-slate-100 rounded-xl px-3 py-2 text-[11px] text-slate-500 font-bold flex items-center justify-between border border-slate-200/40">
          <span>Logs Filtered:</span>
          <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-lg font-mono font-extrabold">
            {filteredEvents.length}
          </span>
        </div>
      </div>

      {/* TIMELINE LIST */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Securing central school audit logs...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-slate-50 border border-slate-100 rounded-3xl py-16 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 border border-slate-200/50 flex items-center justify-center text-slate-400">
            <History className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">No Financial Events Recorded</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
            We couldn't find any chronological logs matching the filter. Choose another student, adjust terms, or generate a simulated audit log.
          </p>
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-200 pl-6 ml-4 space-y-8 py-2">
          {filteredEvents.map((evt) => {
            const style = getEventBadgeStyle(evt.type);
            const dateObj = new Date(evt.date);
            const displayDate = dateObj.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            });
            const displayTime = dateObj.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div key={evt.id} className="relative group">
                {/* Node circle on timeline border line */}
                <div className={`absolute -left-10 top-1.5 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm text-slate-900 ${style.bg}`}>
                  {style.icon}
                </div>

                {/* Event block */}
                <div className="bg-white hover:bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 transition-all hover:shadow-xs space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${style.bg}`}>
                        {evt.type}
                      </span>
                      {evt.referenceNo && (
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                          {evt.referenceNo}
                        </span>
                      )}
                      {evt.studentName && (
                        <span className="bg-indigo-50 border border-indigo-100/50 text-indigo-700 text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {evt.studentName}
                        </span>
                      )}
                      {evt.familyCode && (
                        <span className="bg-amber-50 border border-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {evt.familyCode} Family
                        </span>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-bold text-slate-400 font-mono flex items-center sm:justify-end gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{displayDate} • {displayTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Main event content */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1">
                    <p className="text-slate-700 leading-normal text-[11px] max-w-2xl font-medium">
                      {evt.description}
                    </p>

                    {evt.amount !== undefined && (
                      <div className="text-right shrink-0">
                        <div className="font-mono text-sm font-extrabold text-slate-900">
                          NGN {(evt.amount).toLocaleString()}
                        </div>
                        {evt.status && (
                          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            {evt.status}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Generator Modal */}
      {showGeneratorModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-slate-200/80 rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Generate Financial Event</h3>
              </div>
              <button 
                onClick={() => setShowGeneratorModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateEvent} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Event Type</label>
                <select
                  value={genType}
                  onChange={(e) => setGenType(e.target.value as TimelineEvent['type'])}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                >
                  <option value="Fee Generated">Fee Generated</option>
                  <option value="Payment">Payment</option>
                  <option value="Receipt">Receipt</option>
                  <option value="Books Issued">Books Issued</option>
                  <option value="Discount">Discount</option>
                  <option value="Scholarship">Scholarship</option>
                  <option value="Carry Forward">Carry Forward</option>
                  <option value="Refund">Refund</option>
                  <option value="Restriction">Restriction</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Associated Student (Optional)</label>
                  <select
                    value={genStudentId}
                    onChange={(e) => setGenStudentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
                  >
                    <option value="">-- None --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Associated Family Account (Optional)</label>
                  <select
                    value={genFamilyId}
                    onChange={(e) => setGenFamilyId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
                  >
                    <option value="">-- None --</option>
                    {families.map(f => (
                      <option key={f.id} value={f.id}>{f.familyName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amount (NGN)</label>
                  <input
                    type="number"
                    value={genAmount}
                    onChange={(e) => setGenAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Reference / Ref No</label>
                  <input
                    type="text"
                    value={genRefNo}
                    onChange={(e) => setGenRefNo(e.target.value)}
                    placeholder="e.g. REC-10294"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-700"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Simulated Date</label>
                  <input
                    type="date"
                    value={genDate}
                    onChange={(e) => setGenDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status Label</label>
                  <input
                    type="text"
                    value={genStatus}
                    onChange={(e) => setGenStatus(e.target.value)}
                    placeholder="e.g. Settled, Active, Unpaid"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Detailed Description</label>
                <textarea
                  value={genDescription}
                  onChange={(e) => setGenDescription(e.target.value)}
                  placeholder="Detailed narrative of this simulated transaction..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGeneratorModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {submitting ? 'Committing Event...' : 'Generate and Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
