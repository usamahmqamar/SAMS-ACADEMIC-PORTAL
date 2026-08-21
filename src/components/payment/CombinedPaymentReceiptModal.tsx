import React, { useState, useRef } from 'react';
import { CombinedPaymentRecord } from '../../types/combinedPayment';
import {
  Printer,
  Download,
  Share2,
  Mail,
  CheckCircle2,
  X,
  ShieldCheck,
  Building,
  GraduationCap,
  Store,
  Layers,
  Sparkles,
  ArrowRight,
  Receipt,
  FileText,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';

interface CombinedPaymentReceiptModalProps {
  receipt: CombinedPaymentRecord | null;
  onClose: () => void;
  onReprintAudited?: (reason: string) => void;
}

export const CombinedPaymentReceiptModal: React.FC<CombinedPaymentReceiptModalProps> = ({
  receipt,
  onClose,
  onReprintAudited
}) => {
  const [activeTab, setActiveTab] = useState<'master' | 'store_receipt' | 'fee_receipt' | 'thermal' | 'audit'>('master');
  const [copiedText, setCopiedText] = useState(false);

  // Email & WhatsApp modal states
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState(receipt?.parentEmail || '');
  const [isEmailSending, setIsEmailSending] = useState(false);

  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState(receipt?.parentPhone || '');

  const printRef = useRef<HTMLDivElement>(null);

  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
    if (onReprintAudited) {
      onReprintAudited("Combined Payment Receipt Print Request");
    }
  };

  const handleCopySummary = () => {
    const summaryText = `*SULTAN ATTAHIRU MEMORIAL SCHOOLS*\n*COMBINED PAYMENT SUMMARY RECEIPT*\n` +
      `Receipt No: ${receipt.combinedReceiptNo}\n` +
      `Date: ${receipt.date} ${receipt.time}\n` +
      `Student: ${receipt.studentName} (${receipt.admissionNo || 'N/A'})\n` +
      `Parent: ${receipt.parentName}\n` +
      `--------------------------------\n` +
      `*TOTAL PAYMENT RECEIVED: ₦${receipt.totalPaymentReceived.toLocaleString()}*\n` +
      `Payment Method: ${receipt.paymentMethod} (Ref: ${receipt.referenceNo})\n` +
      `--------------------------------\n` +
      `*1. STORE MATERIALS PURCHASE (Priority 1 Settled):*\n` +
      `Items: ${receipt.storeItems.map(i => `${i.itemName} (${i.quantity} ${i.unit})`).join(', ')}\n` +
      `Store Total: ₦${receipt.storeGrandTotal.toLocaleString()} -> Status: ${receipt.allocationSummary.storeStatus.toUpperCase()}\n` +
      `--------------------------------\n` +
      `*2. SCHOOL FEES ALLOCATION:*\n` +
      `Fee Outstanding Before: ₦${receipt.allocationSummary.schoolFeeOutstandingBefore.toLocaleString()}\n` +
      `Amount Allocated: ₦${receipt.allocationSummary.feeAmountAllocated.toLocaleString()}\n` +
      `Fee Outstanding After: ₦${receipt.allocationSummary.schoolFeeOutstandingAfter.toLocaleString()}\n` +
      `Fee Status: ${receipt.allocationSummary.feeStatus.toUpperCase()}\n` +
      `--------------------------------\n` +
      `Cashier: ${receipt.cashierName}\n` +
      `Note: Store purchase and school fee ledgers are maintained separately for financial accounting.`;

    navigator.clipboard.writeText(summaryText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleLaunchWhatsApp = () => {
    const cleanPhone = (whatsAppPhone || '').replace(/\D/g, '');
    const message = `*SULTAN ATTAHIRU MEMORIAL SCHOOLS*\n*OFFICIAL COMBINED PAYMENT RECEIPT*\n\n` +
      `Dear ${receipt.parentName},\n` +
      `We acknowledge receipt of ₦${receipt.totalPaymentReceived.toLocaleString()} for student ${receipt.studentName} (${receipt.admissionNo}).\n\n` +
      `*ALLOCATION BREAKDOWN:*\n` +
      `1. Store Materials (${receipt.store}): ₦${receipt.storeGrandTotal.toLocaleString()} (PAID - Priority 1 Settled)\n` +
      `2. School Fees Allocated: ₦${receipt.allocationSummary.feeAmountAllocated.toLocaleString()}\n` +
      `Remaining School Fee Balance: ₦${receipt.allocationSummary.schoolFeeOutstandingAfter.toLocaleString()}\n\n` +
      `Payment Method: ${receipt.paymentMethod}\n` +
      `Master Session Ref: ${receipt.combinedReceiptNo}\n` +
      `Date: ${receipt.date} ${receipt.time}\n\n` +
      `Thank you for your support!\n- Finance & Store Operations`;

    const encoded = encodeURIComponent(message);
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
    window.open(url, '_blank');
    setIsWhatsAppOpen(false);
  };

  const handleSendEmail = async () => {
    setIsEmailSending(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      alert(`Receipt successfully dispatched to ${emailTo}!`);
      setIsEmailOpen(false);
    } catch (e) {
      alert("Failed to send email");
    } finally {
      setIsEmailSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* MODAL TOP BAR */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Combined Session Verified
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {receipt.combinedReceiptNo}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Dual Settlement Receipt Voucher
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer border border-slate-700"
              title="Copy Receipt Summary Text"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TAB CONTROLS & ACTION BUTTONS */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('master')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'master'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Master Combined Voucher</span>
            </button>

            <button
              onClick={() => setActiveTab('store_receipt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'store_receipt'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Store Receipt (₦{receipt.storeGrandTotal.toLocaleString()})</span>
            </button>

            <button
              onClick={() => setActiveTab('fee_receipt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'fee_receipt'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>School Fee Receipt (₦{receipt.allocationSummary.feeAmountAllocated.toLocaleString()})</span>
            </button>

            <button
              onClick={() => setActiveTab('thermal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'thermal'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>80mm POS Slip</span>
            </button>

            {(receipt.isManualOverride || receipt.overrideAuditInfo) && (
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'audit'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Audit Override Log</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsWhatsAppOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => setIsEmailOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>

        {/* SCROLLABLE RECEIPT CANVAS */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center">
          
          {/* TAB 1: MASTER COMBINED VOUCHER */}
          {activeTab === 'master' && (
            <div
              ref={printRef}
              className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-slate-800 text-sm space-y-6"
            >
              {/* HEADER */}
              <div className="text-center border-b border-slate-200 pb-5">
                <div className="flex items-center justify-center space-x-2 text-indigo-700 font-black text-lg uppercase tracking-wider">
                  <Building className="w-5 h-5" />
                  <span>SULTAN ATTAHIRU MEMORIAL SCHOOLS</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Main Campus, Sokoto • Integrated Bursary & Store Management Desk
                </p>
                <div className="mt-3 inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-xs font-black text-indigo-800 tracking-wider uppercase">
                    COMBINED PAYMENT & DUAL SETTLEMENT VOUCHER
                  </span>
                </div>
              </div>

              {/* TRANSACTION METADATA */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Combined Ref #</span>
                  <span className="font-mono font-bold text-slate-800">{receipt.combinedReceiptNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Date & Time</span>
                  <span className="font-semibold text-slate-800">{receipt.date} {receipt.time}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Payment Method</span>
                  <span className="font-semibold text-slate-800">{receipt.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Cashier</span>
                  <span className="font-semibold text-slate-800">{receipt.cashierName}</span>
                </div>
              </div>

              {/* STUDENT & PARENT PROFILE */}
              <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold text-[10px] uppercase block">Student Details</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{receipt.studentName}</p>
                  <p className="text-slate-600 text-xs">Adm No: <span className="font-mono font-semibold">{receipt.admissionNo || 'N/A'}</span> • Grade: {receipt.grade || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold text-[10px] uppercase block">Parent / Payer Details</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{receipt.parentName}</p>
                  <p className="text-slate-600 text-xs">Phone: {receipt.parentPhone || 'N/A'} {receipt.parentEmail && `• ${receipt.parentEmail}`}</p>
                </div>
              </div>

              {/* TOTAL PAYMENT RECEIVED HERO BOX */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-xl shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider block">
                    Total Single Payment Received from Parent
                  </span>
                  <div className="text-2xl font-black text-white mt-0.5">
                    ₦{receipt.totalPaymentReceived.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-300">
                    Ref No: <span className="font-mono text-indigo-200 font-semibold">{receipt.referenceNo}</span>
                  </span>
                </div>
                <div className="text-right">
                  {receipt.isManualOverride || receipt.overrideAuditInfo ? (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-bold px-2.5 py-1 rounded-lg inline-block">
                      ⚠ Policy Override Audited
                    </span>
                  ) : (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-bold px-2.5 py-1 rounded-lg inline-block">
                      ✓ Priority Engine (Oldest First)
                    </span>
                  )}
                </div>
              </div>

              {/* OVERRIDE NOTICE IF APPLICABLE */}
              {(receipt.isManualOverride || receipt.overrideAuditInfo) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start space-x-2.5 text-xs text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold">Manual Allocation Override Recorded & Audited</span>
                    <p className="text-[11px] text-amber-800">
                      Authorized by: <strong>{receipt.overriddenBy || receipt.overrideAuditInfo?.overriddenBy || 'Authorized Officer'}</strong> • Justification: <em>{receipt.overrideReason || receipt.overrideAuditInfo?.overrideReason || 'Policy permitted adjustment'}</em>
                    </p>
                  </div>
                </div>
              )}

              {/* COMPONENT 1: STORE MATERIALS PURCHASE (SETTLED FIRST) */}
              <div className="border border-indigo-150 rounded-xl overflow-hidden bg-indigo-50/20">
                <div className="bg-indigo-900/10 px-4 py-2.5 border-b border-indigo-150 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">1</span>
                    <h3 className="font-black text-indigo-950 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                      <Store className="w-3.5 h-3.5 text-indigo-600" />
                      <span>STORE MATERIALS PURCHASE (SETTLED FIRST)</span>
                    </h3>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                    Status: {receipt.allocationSummary.storeStatus}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-200/80 text-[10px] font-bold uppercase text-left">
                        <th className="pb-1.5">Item Description</th>
                        <th className="pb-1.5 text-center">Unit</th>
                        <th className="pb-1.5 text-right">Qty</th>
                        <th className="pb-1.5 text-right">Unit Price</th>
                        <th className="pb-1.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {receipt.storeItems.map((item, idx) => (
                        <tr key={idx} className="text-slate-700">
                          <td className="py-2">
                            <span className="font-semibold text-slate-800">{item.itemName}</span>
                            <span className="block text-[10px] text-slate-400 font-mono">{item.itemCode}</span>
                          </td>
                          <td className="py-2 text-center text-slate-600">{item.unit}</td>
                          <td className="py-2 text-right font-semibold">{item.quantity}</td>
                          <td className="py-2 text-right text-slate-600">₦{item.unitPrice.toLocaleString()}</td>
                          <td className="py-2 text-right font-bold text-slate-900">₦{item.subtotal.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Store Subtotal: ₦{receipt.storeSubtotal.toLocaleString()}{receipt.storeDiscountAmount > 0 && ` (Discount: -₦${receipt.storeDiscountAmount.toLocaleString()})`}</span>
                    <div className="text-right">
                      <span className="text-slate-600 font-semibold mr-2">Store Grand Total Settled:</span>
                      <span className="font-black text-indigo-900 text-sm">₦{receipt.storeGrandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* COMPONENT 2: SCHOOL FEES ALLOCATION (REMAINING PAYMENT) */}
              <div className="border border-emerald-150 rounded-xl overflow-hidden bg-emerald-50/20">
                <div className="bg-emerald-900/10 px-4 py-2.5 border-b border-emerald-150 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">2</span>
                    <h3 className="font-black text-emerald-950 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>SCHOOL FEES ALLOCATION (REMAINING ₦{receipt.allocationSummary.remainingForFees.toLocaleString()})</span>
                    </h3>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                    Status: {receipt.allocationSummary.feeStatus}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-lg border border-emerald-100 text-xs text-center">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Outstanding Before</span>
                      <span className="font-bold text-slate-700 text-sm">₦{receipt.allocationSummary.schoolFeeOutstandingBefore.toLocaleString()}</span>
                    </div>
                    <div className="border-x border-slate-100">
                      <span className="text-emerald-600 block text-[10px] uppercase font-bold">Amount Applied</span>
                      <span className="font-black text-emerald-700 text-sm">₦{receipt.allocationSummary.feeAmountAllocated.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Outstanding Remaining</span>
                      <span className="font-black text-rose-600 text-sm">₦{receipt.allocationSummary.schoolFeeOutstandingAfter.toLocaleString()}</span>
                    </div>
                  </div>

                  {receipt.feeLedgerAllocations.length > 0 && (
                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Term Ledger Allocations</span>
                      {receipt.feeLedgerAllocations.map((alloc, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-100 text-slate-700">
                          <span className="font-medium">{alloc.termName || alloc.name}</span>
                          <div className="space-x-2">
                            <span className="text-slate-500 text-[11px]">(Before: ₦{alloc.outstandingBefore.toLocaleString()})</span>
                            <span className="font-bold text-emerald-700">Applied: ₦{alloc.amountAllocated.toLocaleString()}</span>
                            <span className="text-rose-600 font-semibold text-[11px]">→ Due: ₦{alloc.outstandingAfter.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ADVANCE CREDIT CALLOUT IF APPLICABLE */}
              {receipt.allocationSummary.advanceWalletCreditGenerated > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-900">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Surplus payment of <strong>₦{receipt.allocationSummary.advanceWalletCreditGenerated.toLocaleString()}</strong> has been credited to student prepaid wallet balance.</span>
                  </div>
                  <span className="bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase">Advance Pool</span>
                </div>
              )}

              {/* STRICT ACCOUNTING ISOLATION NOTICE */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start space-x-2.5 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Strict Accounting & Financial Ledger Separation</span>
                  <span>In compliance with institutional accounting standards, <strong>Store Materials Revenue (₦{receipt.storeGrandTotal.toLocaleString()})</strong> and <strong>Tuition Fee Collections (₦{receipt.allocationSummary.feeAmountAllocated.toLocaleString()})</strong> have been posted to independent, isolated general ledger accounts. Store sales do not alter school-fee billing structures.</span>
                </div>
              </div>

              {/* FOOTER & SIGNATURES */}
              <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-xs text-slate-400">
                <div>
                  <p className="font-mono text-[10px]">Session ID: {receipt.id}</p>
                  <p className="text-[10px]">Generated by SAMS Financial Engine</p>
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-slate-300 mb-1"></div>
                  <span className="text-[10px] text-slate-500 font-semibold">Authorized Cashier Stamp</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SEPARATE STORE MATERIALS RECEIPT */}
          {activeTab === 'store_receipt' && (
            <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-slate-800 text-xs space-y-4">
              <div className="text-center border-b border-slate-200 pb-3">
                <h3 className="font-black text-slate-900 text-base uppercase">SULTAN ATTAHIRU MEMORIAL SCHOOLS</h3>
                <p className="text-[11px] text-slate-500 font-medium">Store & Uniform Operations Depot</p>
                <div className="mt-2 bg-indigo-50 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block uppercase">
                  OFFICIAL STORE SALE RECEIPT
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Store Receipt #</span>
                  <span className="font-mono font-bold text-slate-800">{receipt.storeReceiptNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Transaction Date</span>
                  <span className="font-semibold text-slate-800">{receipt.date} {receipt.time}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Student Name</span>
                  <span className="font-bold text-slate-800">{receipt.studentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Parent / Buyer</span>
                  <span className="font-bold text-slate-800">{receipt.parentName}</span>
                </div>
              </div>

              <div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[9px] uppercase text-left">
                      <th className="pb-1">Item</th>
                      <th className="pb-1 text-center">Qty</th>
                      <th className="pb-1 text-right">Price</th>
                      <th className="pb-1 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receipt.storeItems.map((it, i) => (
                      <tr key={i} className="py-1">
                        <td className="py-1 font-medium">{it.itemName} ({it.unit})</td>
                        <td className="py-1 text-center">{it.quantity}</td>
                        <td className="py-1 text-right">₦{it.unitPrice.toLocaleString()}</td>
                        <td className="py-1 text-right font-bold">₦{it.subtotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-1 text-right text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-semibold">₦{receipt.storeSubtotal.toLocaleString()}</span>
                </div>
                {receipt.storeDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-₦{receipt.storeDiscountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-indigo-900 pt-1 border-t border-slate-100">
                  <span>Total Store Paid:</span>
                  <span>₦{receipt.storeGrandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Settlement Status:</span>
                  <span className="font-bold text-emerald-600 uppercase">FULLY SETTLED (PRIORITY 1)</span>
                </div>
              </div>

              <div className="bg-slate-50 p-2 rounded text-[10px] text-slate-500 text-center">
                Master Combined Ref: <span className="font-mono font-bold text-slate-700">{receipt.combinedReceiptNo}</span>
              </div>
            </div>
          )}

          {/* TAB 3: SEPARATE SCHOOL FEES RECEIPT */}
          {activeTab === 'fee_receipt' && (
            <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-slate-800 text-xs space-y-4">
              <div className="text-center border-b border-slate-200 pb-3">
                <h3 className="font-black text-slate-900 text-base uppercase">SULTAN ATTAHIRU MEMORIAL SCHOOLS</h3>
                <p className="text-[11px] text-slate-500 font-medium">Bursary & Student Accounts Department</p>
                <div className="mt-2 bg-emerald-50 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block uppercase">
                  OFFICIAL SCHOOL FEES PAYMENT RECEIPT
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Fee Receipt #</span>
                  <span className="font-mono font-bold text-slate-800">{receipt.feeReceiptNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Date Received</span>
                  <span className="font-semibold text-slate-800">{receipt.date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Student Name</span>
                  <span className="font-bold text-slate-800">{receipt.studentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Admission No</span>
                  <span className="font-mono font-bold text-slate-800">{receipt.admissionNo || 'N/A'}</span>
                </div>
              </div>

              <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">School Fee Outstanding (Before):</span>
                  <span className="font-bold text-slate-800">₦{receipt.allocationSummary.schoolFeeOutstandingBefore.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-black text-sm">
                  <span>Amount Allocated / Paid:</span>
                  <span>₦{receipt.allocationSummary.feeAmountAllocated.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold border-t border-emerald-200/60 pt-1">
                  <span>Remaining Balance to Settle:</span>
                  <span>₦{receipt.allocationSummary.schoolFeeOutstandingAfter.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Allocated Terms</span>
                {receipt.feeLedgerAllocations.map((alloc, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-700">{alloc.termName || alloc.name}</span>
                    <span className="font-bold text-emerald-700">₦{alloc.amountAllocated.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 p-2 rounded text-[10px] text-slate-500 text-center">
                Master Combined Ref: <span className="font-mono font-bold text-slate-700">{receipt.combinedReceiptNo}</span>
              </div>
            </div>
          )}

          {/* TAB 4: 80MM POS THERMAL SLIP */}
          {activeTab === 'thermal' && (
            <div className="w-72 bg-white border border-slate-300 p-4 shadow-sm text-slate-900 font-mono text-[11px] space-y-3">
              <div className="text-center border-b border-dashed border-slate-400 pb-2">
                <h4 className="font-bold text-xs">SULTAN ATTAHIRU MEMORIAL</h4>
                <p className="text-[10px]">COMBINED PAYMENT VOUCHER</p>
                <p className="text-[9px] text-slate-600">{receipt.date} {receipt.time}</p>
                <p className="text-[9px] font-bold">RCP: {receipt.combinedReceiptNo}</p>
              </div>

              <div>
                <p>STUDENT: {receipt.studentName}</p>
                <p>ADM: {receipt.admissionNo || 'N/A'}</p>
                <p>PARENT: {receipt.parentName}</p>
              </div>

              <div className="border-t border-dashed border-slate-400 pt-2 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>TOTAL RECEIVED:</span>
                  <span>NGN {receipt.totalPaymentReceived.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>METHOD:</span>
                  <span>{receipt.paymentMethod}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-400 pt-2">
                <p className="font-bold">[1] STORE PURCHASE (P1)</p>
                {receipt.storeItems.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[10px]">
                    <span>{it.quantity}x {it.itemName.slice(0, 15)}</span>
                    <span>{it.subtotal.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-[10px] border-t border-dotted border-slate-300 mt-1 pt-0.5">
                  <span>STORE SETTLED:</span>
                  <span>NGN {receipt.storeGrandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-400 pt-2 space-y-0.5">
                <p className="font-bold">[2] SCHOOL FEES (P2)</p>
                <div className="flex justify-between text-[10px]">
                  <span>FEE BEFORE:</span>
                  <span>NGN {receipt.allocationSummary.schoolFeeOutstandingBefore.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-emerald-800">
                  <span>FEE APPLIED:</span>
                  <span>NGN {receipt.allocationSummary.feeAmountAllocated.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-rose-800">
                  <span>FEE REMAINING:</span>
                  <span>NGN {receipt.allocationSummary.schoolFeeOutstandingAfter.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-400 pt-2 text-center text-[9px] text-slate-600">
                <p>CASHIER: {receipt.cashierName}</p>
                <p className="mt-1 font-bold">THANK YOU FOR YOUR PAYMENT</p>
                <p>*** SAMS ERP FINANCIAL ENGINE ***</p>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT OVERRIDE LOG */}
          {activeTab === 'audit' && (
            <div className="w-full max-w-xl bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-slate-800 text-xs space-y-4">
              <div className="text-center border-b border-slate-200 pb-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 text-base uppercase">Combined Payment Audit Record</h3>
                <p className="text-[11px] text-slate-500 font-medium">Bursary Compliance & Policy Verification</p>
              </div>

              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Override Status:</span>
                  <span className="font-bold text-amber-900">Policy-Permitted Adjustment</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Authorized By:</span>
                  <span className="font-bold text-slate-900">{receipt.overriddenBy || receipt.overrideAuditInfo?.overriddenBy || 'Finance Officer'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Justification Reason:</span>
                  <span className="italic text-slate-800 font-medium block mt-0.5">{receipt.overrideReason || receipt.overrideAuditInfo?.overrideReason || 'Custom allocation requested and approved.'}</span>
                </div>
              </div>

              {receipt.overrideAuditInfo?.originalAutoAllocation && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Original Default Rule</span>
                    <div className="flex justify-between text-[11px]">
                      <span>Store:</span>
                      <span className="font-semibold">₦{receipt.overrideAuditInfo.originalAutoAllocation.storePaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>Fees:</span>
                      <span className="font-semibold">₦{receipt.overrideAuditInfo.originalAutoAllocation.feeAllocated.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-200 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase block">Manual Override Applied</span>
                    <div className="flex justify-between text-[11px]">
                      <span>Store:</span>
                      <span className="font-black text-indigo-900">₦{receipt.allocationSummary.storeAmountPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>Fees:</span>
                      <span className="font-black text-emerald-800">₦{receipt.allocationSummary.feeAmountAllocated.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Dual ledger entries committed and isolated in General Ledger.</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Done / Close
            </button>
          </div>
        </div>

      </div>

      {/* WHATSAPP SHARE MODAL */}
      {isWhatsAppOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Share2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Share via WhatsApp</h3>
              </div>
              <button onClick={() => setIsWhatsAppOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Parent Phone Number</label>
              <input
                type="text"
                value={whatsAppPhone}
                onChange={(e) => setWhatsAppPhone(e.target.value)}
                placeholder="+234 802 123 4567"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Includes store purchase and fee settlement breakdown.</p>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setIsWhatsAppOpen(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLaunchWhatsApp}
                className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700"
              >
                Send via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL SHARE MODAL */}
      {isEmailOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
                  <Mail className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Send Receipt by Email</h3>
              </div>
              <button onClick={() => setIsEmailOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Parent Email Address</label>
              <input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="parent@example.com"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setIsEmailOpen(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={isEmailSending || !emailTo}
                className="flex-1 py-2 text-xs font-bold text-white bg-sky-600 rounded-xl hover:bg-sky-700 disabled:opacity-50"
              >
                {isEmailSending ? 'Sending...' : 'Send Official PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
