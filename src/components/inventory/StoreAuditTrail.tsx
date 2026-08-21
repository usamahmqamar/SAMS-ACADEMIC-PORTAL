import React, { useState, useMemo, useEffect } from 'react';
import { StoreAuditLog } from '../../types/inventory';
import {
  ShieldCheck,
  Search,
  Calendar,
  User,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle,
  FileText,
  Tag,
  CreditCard,
  Percent,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Mail,
  MessageCircle,
  Download,
  Printer,
  Receipt,
  AlertCircle
} from 'lucide-react';

interface StoreAuditTrailProps {
  onViewReceipt?: (transactionId: string) => void;
}

export const StoreAuditTrail: React.FC<StoreAuditTrailProps> = ({ onViewReceipt }) => {
  const [auditLogs, setAuditLogs] = useState<StoreAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('All');
  const [selectedCashier, setSelectedCashier] = useState('All');
  const [selectedStore, setSelectedStore] = useState('All');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory/audit_trail');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.warn('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        log.transactionId.toLowerCase().includes(q) ||
        (log.studentName && log.studentName.toLowerCase().includes(q)) ||
        (log.admissionNo && log.admissionNo.toLowerCase().includes(q)) ||
        (log.parentName && log.parentName.toLowerCase().includes(q)) ||
        (log.parentPhone && log.parentPhone.includes(q)) ||
        (log.recipientEmail && log.recipientEmail.toLowerCase().includes(q)) ||
        (log.actionDetails && log.actionDetails.toLowerCase().includes(q)) ||
        (log.reprintReason && log.reprintReason.toLowerCase().includes(q)) ||
        (log.referenceNo && log.referenceNo.toLowerCase().includes(q));

      const matchesAction = selectedAction === 'All' || log.actionType === selectedAction;
      const matchesCashier = selectedCashier === 'All' || log.cashierName === selectedCashier;
      const matchesStore = selectedStore === 'All' || log.store === selectedStore;

      return matchesSearch && matchesAction && matchesCashier && matchesStore;
    });
  }, [auditLogs, searchQuery, selectedAction, selectedCashier, selectedStore]);

  const uniqueCashiers = useMemo(() => {
    return Array.from(new Set(auditLogs.map(l => l.cashierName))).filter(Boolean);
  }, [auditLogs]);

  const uniqueStores = useMemo(() => {
    return Array.from(new Set(auditLogs.map(l => l.store))).filter(Boolean);
  }, [auditLogs]);

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'STORE_DIRECT_SALE':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md inline-flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            DIRECT SALE
          </span>
        );
      case 'REPRINT_RECEIPT':
        return (
          <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md inline-flex items-center gap-1">
            <RotateCcw className="w-3 h-3" />
            REPRINT RECEIPT
          </span>
        );
      case 'SEND_EMAIL':
        return (
          <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md inline-flex items-center gap-1">
            <Mail className="w-3 h-3" />
            EMAIL RECEIPT
          </span>
        );
      case 'SHARE_WHATSAPP':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md inline-flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            WHATSAPP SHARE
          </span>
        );
      case 'DOWNLOAD_PDF':
        return (
          <span className="bg-slate-100 text-slate-800 border border-slate-300 text-[10px] font-extrabold px-2 py-0.5 rounded-md inline-flex items-center gap-1">
            <Download className="w-3 h-3" />
            PDF EXPORT
          </span>
        );
      default:
        return (
          <span className="bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
            {actionType}
          </span>
        );
    }
  };

  return (
    <div id="store-audit-trail-view" className="space-y-5 font-sans">
      {/* AUDIT SYSTEM BANNER */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight">Store Sales Immutable Audit Ledger</h2>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                Chain Verified
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Strict audit trail tracking point-of-sale store checkouts, physical receipt reprints, and electronic dispatches.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAuditLogs}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all self-start md:self-auto cursor-pointer border border-slate-700 flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Refresh Ledger
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail by Txn #, Name, Reason, Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-500 transition-all font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
          {/* ACTION TYPE FILTER */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-slate-400 font-semibold">Action:</span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="All">All Actions</option>
              <option value="STORE_DIRECT_SALE">Direct Sale</option>
              <option value="REPRINT_RECEIPT">Reprint Receipt</option>
              <option value="SEND_EMAIL">Send Email</option>
              <option value="SHARE_WHATSAPP">Share WhatsApp</option>
              <option value="DOWNLOAD_PDF">Download PDF</option>
            </select>
          </div>

          {/* CASHIER FILTER */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-slate-400 font-semibold">Cashier:</span>
            <select
              value={selectedCashier}
              onChange={(e) => setSelectedCashier(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="All">All Cashiers</option>
              {uniqueCashiers.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* STORE FILTER */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-slate-400 font-semibold">Store:</span>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="All">All Stores</option>
              {uniqueStores.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3.5">Txn # &amp; Date/Time</th>
                <th className="px-4 py-3.5">Action &amp; Audit Event</th>
                <th className="px-4 py-3.5">Customer &amp; Student</th>
                <th className="px-4 py-3.5">Store &amp; Cashier</th>
                <th className="px-4 py-3.5 text-right">Amount</th>
                <th className="px-4 py-3.5 text-center">Receipt &amp; Snapshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-slate-600">No store audit entries found</p>
                    <p className="text-xs text-slate-400">Perform store checkout sales or reprint operations to view logs.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isExpanded = expandedLogId === log.id;
                  const hasItems = log.items && log.items.length > 0;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-mono font-bold text-indigo-600 text-xs">{log.transactionId}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {log.date} • {log.time}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div>{getActionBadge(log.actionType)}</div>
                          {log.reprintReason && (
                            <div className="text-[10px] text-rose-600 font-semibold mt-1">
                              Reason: {log.reprintReason}
                            </div>
                          )}
                          {log.recipientEmail && (
                            <div className="text-[10px] text-sky-600 font-mono mt-1">
                              To: {log.recipientEmail}
                            </div>
                          )}
                          {log.recipientPhone && (
                            <div className="text-[10px] text-emerald-600 font-mono mt-1">
                              Phone: {log.recipientPhone}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-extrabold text-slate-900">{log.parentName}</div>
                          {log.studentName && log.studentName !== 'N/A' && (
                            <div className="text-[11px] text-slate-600">
                              Student: <span className="font-bold text-slate-800">{log.studentName}</span>
                              {log.admissionNo && log.admissionNo !== 'N/A' && (
                                <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded ml-1 font-bold">
                                  {log.admissionNo}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-800">{log.store || 'Uniform Depot'}</div>
                          <div className="text-[10px] text-slate-500 font-mono">By: {log.cashierName}</div>
                        </td>

                        <td className="px-4 py-3.5 text-right font-mono">
                          {log.totalAmount !== undefined ? (
                            <>
                              <div className="font-black text-slate-900 text-xs">
                                ₦{log.totalAmount.toLocaleString()}
                              </div>
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-block mt-0.5">
                                Fee Isolated
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            {onViewReceipt && (
                              <button
                                onClick={() => onViewReceipt(log.transactionId)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded-lg text-xs transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                title="Open full printable receipt"
                              >
                                <Receipt className="w-3 h-3" />
                                Receipt
                              </button>
                            )}
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold p-1 rounded-lg transition-all cursor-pointer"
                              title={isExpanded ? 'Collapse audit details' : 'Expand audit details'}
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED AUDIT TRAIL ROW */}
                      {isExpanded && (
                        <tr className="bg-indigo-50/30 border-b border-slate-200">
                          <td colSpan={6} className="p-4 sm:p-5 space-y-4">
                            <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs space-y-2">
                              <div className="flex justify-between items-center flex-wrap gap-2 text-xs">
                                <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                  Audit Verification Snapshot: {log.id}
                                </span>
                                <span className="font-mono text-[11px] text-slate-500">
                                  Timestamp: {log.timestamp}
                                </span>
                              </div>

                              {log.actionDetails && (
                                <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-medium">
                                  {log.actionDetails}
                                </p>
                              )}
                            </div>

                            {/* INVENTORY ITEM DELTAS IF PRESENT */}
                            {hasItems && (
                              <div className="bg-white rounded-xl border border-indigo-100 overflow-hidden shadow-2xs">
                                <div className="bg-slate-900 text-white px-4 py-2 text-xs font-bold flex justify-between items-center">
                                  <span>Inventory Quantity Reduction &amp; Stock Delta Snapshot</span>
                                  <span className="text-[10px] text-slate-300 font-normal">Real-time Stock Verification</span>
                                </div>
                                <table className="w-full text-xs text-left">
                                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase">
                                    <tr>
                                      <th className="px-4 py-2">Item Name / Code</th>
                                      <th className="px-4 py-2 text-center">Unit</th>
                                      <th className="px-4 py-2 text-center">Stock Before</th>
                                      <th className="px-4 py-2 text-center">Qty Dispensed</th>
                                      <th className="px-4 py-2 text-center">Stock After</th>
                                      <th className="px-4 py-2 text-right">Unit Price</th>
                                      <th className="px-4 py-2 text-right">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {log.items?.map((it, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-2.5">
                                          <span className="font-bold text-slate-900">{it.itemName}</span>
                                          <span className="block text-[10px] font-mono text-indigo-600">{it.itemCode}</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-center font-medium text-slate-600">{it.unit}</td>
                                        <td className="px-4 py-2.5 text-center font-mono text-slate-600 font-semibold">{it.stockBefore}</td>
                                        <td className="px-4 py-2.5 text-center font-mono font-bold text-rose-600">
                                          -{it.qtySold}
                                        </td>
                                        <td className="px-4 py-2.5 text-center font-mono text-emerald-700 font-bold bg-emerald-50/40">
                                          {it.stockAfter}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono text-slate-700">₦{it.unitPrice.toLocaleString()}</td>
                                        <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">₦{it.total.toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* AUDIT MEMO & POLICY GUARANTEE */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              <div className="bg-white p-3 rounded-xl border border-indigo-100">
                                <span className="font-bold text-slate-500 text-[10px] uppercase block">Cashier Signature &amp; Notes</span>
                                <p className="font-semibold text-slate-800 mt-0.5">{log.cashierName} ({log.cashierId})</p>
                                <p className="text-slate-600 text-[11px] mt-0.5 italic">"{log.notes || 'Direct store sale to parent'}"</p>
                              </div>

                              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-900">
                                <span className="font-bold text-emerald-700 text-[10px] uppercase block">Financial Separation Guarantee</span>
                                <p className="text-[11px] font-medium mt-0.5">
                                  This transaction is logged strictly in the Store Material Sales Ledger. No modifications were made to the student's tuition or school fees balance.
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
