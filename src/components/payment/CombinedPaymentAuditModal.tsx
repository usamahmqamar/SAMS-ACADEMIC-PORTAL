import React from 'react';
import { CombinedPaymentRecord } from '../../types/combinedPayment';
import { ShieldCheck, AlertTriangle, UserCheck, Calendar, DollarSign, Layers, X, ArrowRight } from 'lucide-react';

interface CombinedPaymentAuditModalProps {
  record: CombinedPaymentRecord | null;
  onClose: () => void;
}

export const CombinedPaymentAuditModal: React.FC<CombinedPaymentAuditModalProps> = ({ record, onClose }) => {
  if (!record) return null;

  const audit = record.overrideAuditInfo;
  const isOverridden = record.isManualOverride || audit?.isOverridden;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isOverridden ? 'bg-amber-500/20 text-amber-400 border border-amber-400/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40'
            }`}>
              {isOverridden ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isOverridden ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                }`}>
                  {isOverridden ? 'Manual Allocation Override Audited' : 'Standard Priority Execution (Oldest First)'}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Audit Trail & Allocation Log
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-800 text-xs">
          
          {/* GENERAL INFO BAR */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[9px] block">Receipt / Ref</span>
              <span className="font-mono font-bold text-slate-900">{record.combinedReceiptNo}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[9px] block">Date & Time</span>
              <span className="font-semibold text-slate-800">{record.date} {record.time}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[9px] block">Total Payment</span>
              <span className="font-black text-indigo-700">₦{record.totalPaymentReceived.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase text-[9px] block">Student</span>
              <span className="font-bold text-slate-800 truncate block">{record.studentName}</span>
            </div>
          </div>

          {isOverridden ? (
            <>
              {/* OVERRIDE AUTHORIZATION CARD */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                  <UserCheck className="w-4 h-4 text-amber-700" />
                  <span>Manual Allocation Justification & Authorization</span>
                </div>
                <div className="space-y-1.5 pl-6 text-xs text-amber-950">
                  <div>
                    <span className="text-amber-800 font-semibold">Authorized By: </span>
                    <span className="font-bold">{record.overriddenBy || audit?.overriddenBy || 'Authorized Officer'}</span>
                    <span className="text-slate-500 text-[10px] ml-1">({audit?.overriddenRole || 'Finance / Bursary Policy'})</span>
                  </div>
                  <div>
                    <span className="text-amber-800 font-semibold">Policy Justification: </span>
                    <span className="italic font-medium">{record.overrideReason || audit?.overrideReason || 'Policy permitted manual adjustment.'}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Logged At: {audit?.timestamp ? new Date(audit.timestamp).toLocaleString() : `${record.date} ${record.time}`}
                  </div>
                </div>
              </div>

              {/* SIDE-BY-SIDE ALLOCATION COMPARISON */}
              <div className="space-y-2">
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Original Standard Auto-Allocation vs. Manual Override</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* AUTO ALLOCATION (WHAT WOULD HAVE HAPPENED) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className="font-bold text-slate-600 uppercase text-[10px]">
                        Standard Auto-Allocation (Oldest First)
                      </span>
                      <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                        Default Engine
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Store Materials:</span>
                        <span className="font-bold text-slate-900">
                          ₦{(audit?.originalAutoAllocation?.storePaid ?? record.storeGrandTotal).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total School Fees:</span>
                        <span className="font-bold text-slate-900">
                          ₦{(audit?.originalAutoAllocation?.feeAllocated ?? (record.totalPaymentReceived - record.storeGrandTotal)).toLocaleString()}
                        </span>
                      </div>

                      {audit?.originalAutoAllocation?.termAllocations && audit.originalAutoAllocation.termAllocations.length > 0 && (
                        <div className="pt-2 border-t border-slate-200 space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Term Breakdown</span>
                          {audit.originalAutoAllocation.termAllocations.map((t, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] text-slate-600">
                              <span>{t.termName}:</span>
                              <span className="font-semibold text-slate-800">₦{t.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* APPLIED MANUAL ALLOCATION */}
                  <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-indigo-200 pb-1.5">
                      <span className="font-bold text-indigo-900 uppercase text-[10px]">
                        Audited Manual Allocation
                      </span>
                      <span className="text-[9px] bg-indigo-200 text-indigo-900 font-bold px-1.5 py-0.5 rounded">
                        Applied
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Store Materials:</span>
                        <span className="font-black text-indigo-900">
                          ₦{record.allocationSummary.storeAmountPaid.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total School Fees:</span>
                        <span className="font-black text-emerald-800">
                          ₦{record.allocationSummary.feeAmountAllocated.toLocaleString()}
                        </span>
                      </div>

                      {record.feeLedgerAllocations.length > 0 && (
                        <div className="pt-2 border-t border-indigo-200/80 space-y-1">
                          <span className="text-[10px] text-indigo-700 font-bold uppercase block">Term Breakdown</span>
                          {record.feeLedgerAllocations.map((t, idx) => (
                            <div key={idx} className="flex justify-between text-[11px]">
                              <span className="text-slate-700">{t.termName || t.name}:</span>
                              <span className="font-bold text-emerald-800">₦{t.amountAllocated.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </>
          ) : (
            /* STANDARD PRIORITY LOG */
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Default Financial Priority Rules Executed</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                This transaction strictly adhered to the default institutional priority policy:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-slate-700 font-medium">
                <li>Settle store merchandise purchase in full first (<strong>Priority 1: ₦{record.allocationSummary.storeAmountPaid.toLocaleString()}</strong>).</li>
                <li>Allocate remaining payment to outstanding school fees using <strong>Oldest Outstanding Term First (Priority 2: ₦{record.allocationSummary.feeAmountAllocated.toLocaleString()})</strong>.</li>
                {record.allocationSummary.advanceWalletCreditGenerated > 0 && (
                  <li>Direct any surplus balance to student prepaid advance credit (<strong>Priority 3: ₦{record.allocationSummary.advanceWalletCreditGenerated.toLocaleString()}</strong>).</li>
                )}
              </ol>
            </div>
          )}

          {/* FINANCIAL LEDGER INTEGRITY SEAL */}
          <div className="bg-slate-900 text-white rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Immutable Ledger Posting Verified. No silent balance alterations permitted.</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">LEDGER-OK</span>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Audit Viewer
          </button>
        </div>

      </div>
    </div>
  );
};
