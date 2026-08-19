import React, { useState } from 'react';
import { TrendingUp, BarChart3, Download, RefreshCw, FileText, Calendar, Layers, Users, Award } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export const AnalyticsReports: React.FC = () => {
  const [selectedTerm, setSelectedTerm] = useState('Term-1');
  const [isExporting, setIsExporting] = useState(false);

  // Performance trends data
  const performanceData = [
    { name: 'Week 1', Math: 68, English: 74, Science: 70 },
    { name: 'Week 3', Math: 72, English: 76, Science: 73 },
    { name: 'Week 5', Math: 78, English: 80, Science: 75 },
    { name: 'Week 7', Math: 75, English: 82, Science: 81 },
    { name: 'Week 9', Math: 82, English: 85, Science: 84 },
    { name: 'Week 11', Math: 85, English: 89, Science: 86 }
  ];

  // Enrollment data across divisions
  const divisionData = [
    { name: 'Nursery', Girls: 45, Boys: 40, Total: 85 },
    { name: 'Primary 1-3', Girls: 88, Boys: 92, Total: 180 },
    { name: 'Primary 4-5', Girls: 64, Boys: 70, Total: 134 },
    { name: 'Secondary JS', Girls: 75, Boys: 72, Total: 147 },
    { name: 'Secondary SS', Girls: 92, Boys: 95, Total: 187 }
  ];

  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert('📊 REPORT EXPORTED SUCCESSFULLY!\nSAMS corporate statistics and academic records consolidated as an audit-ready CSV.');
    }, 1200);
  };

  return (
    <div id="erp-view-analytics" className="space-y-6">
      {/* MODULE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-xs border border-indigo-100">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Academic Analytics &amp; Reports</h1>
              <p className="text-xs text-slate-500 font-medium">Cohort grading performance trends, student demographic breakdown, and statutory compliance metrics</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button 
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all cursor-pointer shadow-sm"
          >
            {isExporting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Export Statutory CSV</span>
          </button>
        </div>
      </div>

      {/* STRATEGIC KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Campus GPA</p>
            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded">SAMS Grade A</span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">3.45 / 4.0</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-1.5">▲ +0.12 pts from last term</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance Index</p>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded">Excellent</span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">94.8%</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-1.5">▲ +0.5% historical streak</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Onboarded Cohorts</p>
            <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded">All Branches</span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">733 Students</p>
          <p className="text-[10px] text-slate-500 font-semibold mt-1.5">Distributed in 4 branches</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-xs">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teacher Ratio</p>
            <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded">Ideal</span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">1:18</p>
          <p className="text-[10px] text-slate-500 font-semibold mt-1.5">Compliance standards met</p>
        </div>
      </div>

      {/* CHART MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GPA GRADING PROGRESS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Academic Subject Trends</h3>
              <p className="text-[10px] text-slate-400">Weekly performance tracker across primary course categories</p>
            </div>
            <select 
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold px-2 py-1 cursor-pointer"
            >
              <option value="Term-1">First Semester Term</option>
              <option value="Term-2">Second Semester Term</option>
            </select>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="mathGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} domain={[50, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="Math" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#mathGrad)" />
                <Area type="monotone" dataKey="English" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#engGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DEMOGRAPHIC ENROLLMENT BREAKDOWN */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Demographic & Division Enrollment</h3>
            <p className="text-[10px] text-slate-400">Branch student allocation ratios grouped by academic levels & gender</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={divisionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                <Bar dataKey="Girls" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="Boys" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TEACHING RECORDS & TEACHER PERFORMANCE STATUTORY SUITE */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl border border-indigo-800/80 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px] font-extrabold uppercase tracking-wider">
                Statutory Intelligence Suite
              </span>
              <span className="text-[11px] text-emerald-400 font-bold">13 Audit-Ready Modules</span>
            </div>
            <h3 className="font-extrabold text-base text-white mt-1">Teaching Records &amp; Teacher Performance Reporting Hub</h3>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              Comprehensive institutional dockets, syllabus coverage, exercise book verification, and multi-term/session performance tracking
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-slate-900">
          <div className="bg-white/95 p-3.5 rounded-xl border border-white/20 shadow-xs space-y-1">
            <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-wider">Curriculum Coverage</span>
            <h4 className="font-bold text-xs text-slate-900">Syllabus Pacing Docket</h4>
            <p className="text-[10px] text-slate-500">Weekly milestones vs. actual taught pacing across all grades.</p>
          </div>

          <div className="bg-white/95 p-3.5 rounded-xl border border-white/20 shadow-xs space-y-1">
            <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider">Student Work Audit</span>
            <h4 className="font-bold text-xs text-slate-900">Student Book Coverage</h4>
            <p className="text-[10px] text-slate-500">Physical notebook completion and exercise marking audit.</p>
          </div>

          <div className="bg-white/95 p-3.5 rounded-xl border border-white/20 shadow-xs space-y-1">
            <span className="text-[9px] font-extrabold text-amber-600 uppercase tracking-wider">Submission Adherence</span>
            <h4 className="font-bold text-xs text-slate-900">Teacher Compliance Register</h4>
            <p className="text-[10px] text-slate-500">Timeline deadline adherence, late submissions, and missing logs.</p>
          </div>

          <div className="bg-white/95 p-3.5 rounded-xl border border-white/20 shadow-xs space-y-1">
            <span className="text-[9px] font-extrabold text-purple-600 uppercase tracking-wider">Evaluations &amp; Trends</span>
            <h4 className="font-bold text-xs text-slate-900">Multi-Term Performance</h4>
            <p className="text-[10px] text-slate-500">Comparative analytics: Term 1 vs 2 vs 3 and Session vs Previous.</p>
          </div>
        </div>
      </div>

      {/* REPORT EXPORTS DESK */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900">SAMS Regulatory Compliance Registers</h3>
          <p className="text-[10px] text-slate-400">Download formatted compliance reports tailored for statutory ministry checks</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/5 transition-all flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-800">Ministry Grading Report</h4>
              <p className="text-[10px] text-slate-500 mt-1">Full marks transcript formatted for regional board submission.</p>
              <button onClick={handleExportCSV} className="text-[10px] text-indigo-600 hover:underline font-bold mt-2 cursor-pointer">Download Ledger</button>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/5 transition-all flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-800">Enrollment Demographic CSV</h4>
              <p className="text-[10px] text-slate-500 mt-1">Onboarding census reports including branch indices and genders.</p>
              <button onClick={handleExportCSV} className="text-[10px] text-indigo-600 hover:underline font-bold mt-2 cursor-pointer">Download Ledger</button>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/5 transition-all flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-800">Attendance Audit Register</h4>
              <p className="text-[10px] text-slate-500 mt-1">Consolidated absence tracker and statutory justification forms.</p>
              <button onClick={handleExportCSV} className="text-[10px] text-indigo-600 hover:underline font-bold mt-2 cursor-pointer">Download Ledger</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
