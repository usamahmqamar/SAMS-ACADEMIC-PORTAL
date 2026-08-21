import React, { useState } from 'react';
import { StoreSaleRecord } from '../../types/inventory';
import { jsPDF } from 'jspdf';
import {
  X,
  Printer,
  CheckCircle,
  Share2,
  Copy,
  FileText,
  ShieldCheck,
  Download,
  Mail,
  Send,
  MessageCircle,
  AlertTriangle,
  RotateCcw,
  Check,
  Phone,
  Building,
  User,
  Calendar,
  CreditCard,
  Receipt,
  Sparkles
} from 'lucide-react';

interface StoreSaleReceiptModalProps {
  sale: StoreSaleRecord | null;
  onClose: () => void;
  onReceiptUpdated?: (updatedSale: StoreSaleRecord) => void;
}

export const StoreSaleReceiptModal: React.FC<StoreSaleReceiptModalProps> = ({
  sale,
  onClose,
  onReceiptUpdated
}) => {
  const [currentSale, setCurrentSale] = useState<StoreSaleRecord | null>(sale);
  const [viewMode, setViewMode] = useState<'a4' | 'thermal'>('a4');
  const [copied, setCopied] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState(sale?.parentEmail || '');
  const [emailNote, setEmailNote] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // WhatsApp modal state
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState(sale?.parentPhone || '');
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);

  // Reprint modal state
  const [showReprintModal, setShowReprintModal] = useState(false);
  const [reprintReason, setReprintReason] = useState('Parent Requested Physical Duplicate');
  const [isReprinting, setIsReprinting] = useState(false);

  // Sync state if sale prop changes
  React.useEffect(() => {
    if (sale) {
      setCurrentSale(sale);
      setEmailInput(sale.parentEmail || '');
      setPhoneInput(sale.parentPhone || '');
    }
  }, [sale]);

  if (!currentSale) return null;

  const displaySale = currentSale;
  const schoolName = displaySale.schoolName || 'SULTAN ATTAHIRU MEMORIAL SCHOOLS';
  const receiptNo = displaySale.receiptNumber || `RCP-${displaySale.transactionNo || displaySale.id}`;
  const txnNo = displaySale.transactionNo || displaySale.id;
  const amountPaid = displaySale.amountPaid !== undefined ? displaySale.amountPaid : displaySale.totalAmount;
  const balanceDue = displaySale.balanceDue !== undefined ? displaySale.balanceDue : 0;

  // 1. AUDIT LOG HELPER
  const recordAuditAction = async (
    actionType: 'REPRINT_RECEIPT' | 'DOWNLOAD_PDF' | 'SHARE_WHATSAPP' | 'SEND_EMAIL',
    details?: {
      reprintReason?: string;
      recipientEmail?: string;
      recipientPhone?: string;
      actionDetails?: string;
    }
  ) => {
    try {
      const res = await fetch('/api/inventory/receipts/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: txnNo,
          actionType,
          cashierId: displaySale.cashierId || 'usr-cashier-01',
          cashierName: displaySale.cashierName,
          ...details
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sale) {
          setCurrentSale(data.sale);
          if (onReceiptUpdated) onReceiptUpdated(data.sale);
        }
      }
    } catch (err) {
      console.warn('Failed to log receipt audit action:', err);
    }
  };

  // 2. PRINT HANDLER
  const handlePrint = async (reason?: string) => {
    await recordAuditAction('REPRINT_RECEIPT', {
      reprintReason: reason || (displaySale.reprintCount ? 'Duplicate Print Requested' : 'Initial POS Printout')
    });
    window.print();
    setActionSuccessMessage('Print command sent & logged to audit trail.');
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  // 3. PDF GENERATION WITH jsPDF
  const handleGeneratePDF = async () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Top Banner (Dark Navy)
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(schoolName, 15, 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(203, 213, 225);
      doc.text(`${displaySale.branch} • ${displaySale.store} • Sokoto Campus`, 15, 18);

      // STORE SALE BADGE (Prominent)
      doc.setFillColor(79, 70, 229); // indigo-600
      doc.roundedRect(142, 5, 53, 16, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('STORE SALE', 168.5, 11.5, { align: 'center' });
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('NON-TUITION RECEIPT', 168.5, 16.5, { align: 'center' });

      // Receipt Metadata Card
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 32, 180, 24, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, 32, 180, 24, 2, 2, 'S');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('RECEIPT NUMBER', 20, 38);
      doc.text('TRANSACTION NUMBER', 70, 38);
      doc.text('DATE & TIME', 125, 38);
      doc.text('CASHIER', 165, 38);

      doc.setFontSize(9);
      doc.setTextColor(79, 70, 229);
      doc.text(receiptNo, 20, 44);
      doc.setTextColor(30, 41, 59);
      doc.text(txnNo, 70, 44);
      doc.text(`${displaySale.saleDate} ${displaySale.time}`, 125, 44);
      doc.text(displaySale.cashierName, 165, 44);

      if (displaySale.reprintCount && displaySale.reprintCount > 0) {
        doc.setTextColor(220, 38, 38);
        doc.setFontSize(7);
        doc.text(`[OFFICIAL REPRINT - COPY #${displaySale.reprintCount}]`, 20, 51);
      } else {
        doc.setTextColor(5, 150, 105);
        doc.setFontSize(7);
        doc.text('[ORIGINAL CUSTOMER ISSUANCE]', 20, 51);
      }

      // Customer & Student Profile
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 60, 180, 22, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, 60, 180, 22, 2, 2, 'S');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('PARENT / CUSTOMER', 20, 66);
      doc.text('STUDENT NAME', 80, 66);
      doc.text('ADMISSION NUMBER', 140, 66);

      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(displaySale.parentName + (displaySale.parentPhone ? ` (${displaySale.parentPhone})` : ''), 20, 74);
      doc.text((displaySale.studentName || 'Walk-in') + (displaySale.grade ? ` (${displaySale.grade})` : ''), 80, 74);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(79, 70, 229);
      doc.text(displaySale.admissionNo || 'N/A', 140, 74);

      // Itemized Table Header
      let y = 88;
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y, 180, 8, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.line(15, y + 8, 195, y + 8);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('ITEMS PURCHASED', 20, y + 5.5);
      doc.text('QTY', 115, y + 5.5, { align: 'center' });
      doc.text('UNIT', 135, y + 5.5, { align: 'center' });
      doc.text('UNIT PRICE (NGN)', 160, y + 5.5, { align: 'right' });
      doc.text('TOTAL (NGN)', 190, y + 5.5, { align: 'right' });

      // Table Rows
      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);

      displaySale.items.forEach((it) => {
        doc.setFont('helvetica', 'bold');
        doc.text(it.itemName, 20, y + 3.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(it.itemCode, 20, y + 7.5);

        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`${it.quantity}`, 115, y + 5, { align: 'center' });
        doc.text(it.unit, 135, y + 5, { align: 'center' });
        doc.text(`₦${it.unitPrice.toLocaleString()}`, 160, y + 5, { align: 'right' });
        doc.setFont('helvetica', 'bold');
        doc.text(`₦${it.subtotal.toLocaleString()}`, 190, y + 5, { align: 'right' });

        doc.setDrawColor(241, 245, 249);
        doc.line(15, y + 9, 195, y + 9);
        y += 11;
      });

      // Totals & Payment Summary Card
      y += 3;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(120, y, 75, 36, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(120, y, 75, 36, 2, 2, 'S');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Subtotal:', 125, y + 6);
      doc.text(`₦${displaySale.subtotal.toLocaleString()}`, 190, y + 6, { align: 'right' });

      if (displaySale.discountAmount > 0) {
        doc.setTextColor(5, 150, 105);
        doc.text('Discount:', 125, y + 11);
        doc.text(`-₦${displaySale.discountAmount.toLocaleString()}`, 190, y + 11, { align: 'right' });
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text('GRAND TOTAL:', 125, y + 18);
      doc.setTextColor(79, 70, 229);
      doc.text(`₦${displaySale.totalAmount.toLocaleString()}`, 190, y + 18, { align: 'right' });

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Amount Paid:', 125, y + 24);
      doc.setTextColor(5, 150, 105);
      doc.text(`₦${amountPaid.toLocaleString()}`, 190, y + 24, { align: 'right' });

      doc.setTextColor(100, 116, 139);
      doc.text('Balance:', 125, y + 30);
      doc.setTextColor(30, 41, 59);
      doc.text(`₦${balanceDue.toFixed(2)} (Fully Settled)`, 190, y + 30, { align: 'right' });

      // Left Box: Payment Method
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, y, 100, 36, 2, 2, 'F');
      doc.roundedRect(15, y, 100, 36, 2, 2, 'S');

      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('PAYMENT METHOD', 20, y + 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(displaySale.paymentMethod, 20, y + 13);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Reference: ${displaySale.referenceNo}`, 20, y + 19);
      if (displaySale.notes) {
        doc.text(`Memo: ${displaySale.notes}`, 20, y + 25);
      }

      // Mandatory Fee Isolation Notice Banner
      y += 40;
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(15, y, 180, 16, 2, 2, 'F');
      doc.setDrawColor(254, 202, 202);
      doc.roundedRect(15, y, 180, 16, 2, 2, 'S');

      doc.setTextColor(185, 28, 28); // red-700
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('OFFICIAL NOTICE: STORE SALE RECEIPT — ISOLATED FROM SCHOOL FEES', 20, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('This receipt represents an immediate point-of-sale store issuance for materials and uniforms.', 20, y + 9.5);
      doc.text('DO NOT confuse this store receipt with a tuition or school-fee receipt. Zero impact on student fee balances.', 20, y + 13.5);

      // Cashier Signature
      y += 22;
      doc.setDrawColor(203, 213, 225);
      doc.line(15, y + 10, 75, y + 10);
      doc.line(135, y + 10, 195, y + 10);

      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Cashier: ${displaySale.cashierName}`, 15, y + 14);
      doc.text('Store Officer Stamp & Signature', 135, y + 14);

      // Save PDF
      doc.save(`Store_Sale_Receipt_${txnNo}.pdf`);

      await recordAuditAction('DOWNLOAD_PDF');
      setActionSuccessMessage(`PDF successfully generated & downloaded (${txnNo}.pdf)`);
      setTimeout(() => setActionSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // 4. GENERATE WHATSAPP MESSAGE
  const generateWhatsAppText = () => {
    const itemLines = displaySale.items
      .map(it => `• *${it.itemName}* (${it.itemCode})\n  Qty: ${it.quantity} ${it.unit} @ ₦${it.unitPrice.toLocaleString()} = *₦${it.subtotal.toLocaleString()}*`)
      .join('\n');

    return [
      `🏛️ *${schoolName.toUpperCase()}*`,
      `📍 *${displaySale.branch} — ${displaySale.store}*`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `🏷️ *OFFICIAL STORE SALE RECEIPT*`,
      `*Receipt No:* ${receiptNo}`,
      `*Transaction No:* ${txnNo}`,
      `*Date:* ${displaySale.saleDate} • ${displaySale.time}`,
      `*Cashier:* ${displaySale.cashierName}`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 *Parent/Customer:* ${displaySale.parentName}`,
      displaySale.studentName ? `🎓 *Student:* ${displaySale.studentName}` : '',
      displaySale.admissionNo ? `🆔 *Admission No:* ${displaySale.admissionNo}` : '',
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `📦 *ITEMS PURCHASED:*`,
      itemLines,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `*Subtotal:* ₦${displaySale.subtotal.toLocaleString()}`,
      displaySale.discountAmount > 0 ? `*Discount:* -₦${displaySale.discountAmount.toLocaleString()}` : '',
      `*GRAND TOTAL:* ₦${displaySale.totalAmount.toLocaleString()}`,
      `*Payment Method:* ${displaySale.paymentMethod}`,
      `*Amount Paid:* ₦${amountPaid.toLocaleString()}`,
      `*Balance:* ₦${balanceDue.toFixed(2)} (Fully Settled)`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `⚠️ *NOTE:* This is an official *STORE SALE RECEIPT* for materials & uniforms only, completely isolated from tuition & school-fee accounts.`,
      `_Thank you for your patronage!_`
    ].filter(Boolean).join('\n');
  };

  const handleShareWhatsApp = async () => {
    const msg = generateWhatsAppText();
    const cleanPhone = phoneInput.replace(/[^0-9]/g, '');
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    await recordAuditAction('SHARE_WHATSAPP', {
      recipientPhone: phoneInput || displaySale.parentPhone,
      actionDetails: `Receipt shared via WhatsApp to ${phoneInput || displaySale.parentPhone || 'Customer'}`
    });

    window.open(url, '_blank');
    setShowWhatsAppModal(false);
    setActionSuccessMessage(`WhatsApp link created for ${phoneInput || 'customer'} & logged to audit trail.`);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  // 5. SEND BY EMAIL
  const handleSendEmail = async () => {
    if (!emailInput.trim()) {
      alert('Please provide a valid recipient email address.');
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await fetch('/api/inventory/receipts/send_email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId: txnNo,
          recipientEmail: emailInput.trim(),
          cashierName: displaySale.cashierName,
          notes: emailNote.trim()
        })
      });

      if (!res.ok) {
        throw new Error('Failed to send email receipt');
      }

      const data = await res.json();
      if (data.sale) {
        setCurrentSale(data.sale);
        if (onReceiptUpdated) onReceiptUpdated(data.sale);
      }

      setShowEmailModal(false);
      setActionSuccessMessage(`Store receipt successfully emailed to ${emailInput.trim()}!`);
      setTimeout(() => setActionSuccessMessage(null), 4500);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // 6. COPY TEXT SUMMARY
  const handleCopyText = () => {
    const summary = generateWhatsAppText();
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // 7. CONFIRM REPRINT
  const handleConfirmReprint = async () => {
    setIsReprinting(true);
    try {
      await handlePrint(reprintReason);
      setShowReprintModal(false);
    } finally {
      setIsReprinting(false);
    }
  };

  return (
    <div id="store-receipt-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight">Store Sales Receipt System</h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                  STORE SALE
                </span>
                {displaySale.reprintCount && displaySale.reprintCount > 0 ? (
                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                    REPRINT #{displaySale.reprintCount}
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Receipt #{receiptNo} • Txn #{txnNo}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* VIEW MODE TOGGLE */}
            <div className="hidden sm:flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs font-semibold">
              <button
                onClick={() => setViewMode('a4')}
                className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                  viewMode === 'a4' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                A4 Voucher
              </button>
              <button
                onClick={() => setViewMode('thermal')}
                className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                  viewMode === 'thermal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                80mm POS
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NOTIFICATION TOAST */}
        {actionSuccessMessage && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              {actionSuccessMessage}
            </span>
            <button onClick={() => setActionSuccessMessage(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* RECEIPT CONTENT AREA */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100/60 grow">
          {viewMode === 'a4' ? (
            /* A4 FORMAT VOUCHER */
            <div id="printable-store-receipt" className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6 text-slate-800 font-sans max-w-2xl mx-auto">
              {/* TOP HEADER */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-slate-200 gap-4">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      S
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">{schoolName}</h2>
                      <p className="text-[11px] text-slate-500 font-medium">Sokoto Campus • School Store &amp; Uniform Depot</p>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right w-full sm:w-auto">
                  <div className="inline-block bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-md shadow-2xs">
                    STORE SALE
                  </div>
                  <p className="text-xs font-mono font-bold text-slate-800 mt-1">Receipt: <span className="text-indigo-600">{receiptNo}</span></p>
                  <p className="text-[11px] text-slate-400 font-mono">Txn: {txnNo}</p>
                </div>
              </div>

              {/* REPRINT WATERMARK NOTICE IF APPLICABLE */}
              {displaySale.reprintCount && displaySale.reprintCount > 0 ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <RotateCcw className="w-4 h-4 text-rose-600" />
                    <div>
                      <span className="font-bold">OFFICIAL REPRINT — COPY #{displaySale.reprintCount}</span>
                      <p className="text-[10px] text-rose-700">
                        Reprinted by {displaySale.lastReprintedBy || displaySale.cashierName} • Reason: {displaySale.lastReprintReason || 'Customer Request'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-rose-600 font-bold">AUDITED</span>
                </div>
              ) : null}

              {/* CUSTOMER, STUDENT & LOCATION RECORD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 text-xs">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer &amp; Student Record</p>
                  <p className="font-extrabold text-slate-900 text-sm">{displaySale.parentName}</p>
                  {displaySale.studentName && (
                    <p className="text-slate-700 font-medium">
                      Student: <span className="font-bold text-slate-900">{displaySale.studentName}</span>{' '}
                      {displaySale.admissionNo && (
                        <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 font-bold ml-1">
                          {displaySale.admissionNo}
                        </span>
                      )}
                      {displaySale.grade && <span className="text-slate-500 ml-1">({displaySale.grade})</span>}
                    </p>
                  )}
                  {displaySale.parentPhone && <p className="text-slate-500 font-mono text-[11px]">Phone: {displaySale.parentPhone}</p>}
                  {displaySale.parentEmail && <p className="text-slate-500 font-mono text-[11px]">Email: {displaySale.parentEmail}</p>}
                </div>

                <div className="space-y-1.5 sm:text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dispensing Store &amp; Cashier</p>
                  <p className="font-extrabold text-slate-800">{displaySale.store}</p>
                  <p className="text-slate-600">Branch: {displaySale.branch}</p>
                  <p className="text-slate-500">Date: <span className="font-semibold text-slate-700">{displaySale.saleDate} • {displaySale.time}</span></p>
                  <p className="text-slate-500">Cashier: <span className="font-bold text-slate-900">{displaySale.cashierName}</span></p>
                </div>
              </div>

              {/* ITEMIZED PURCHASE TABLE */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Item Description</th>
                      <th className="px-4 py-3 text-center">Unit</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {displaySale.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <div className="font-extrabold text-slate-900">{it.itemName}</div>
                          <div className="text-[10px] text-indigo-600 font-mono font-medium">{it.itemCode}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded text-[10px]">
                            {it.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium">₦{it.unitPrice.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center font-bold font-mono text-slate-900">
                          {it.quantity} {it.unit.toLowerCase()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          ₦{it.subtotal.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TOTALS & FINANCIAL SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-1">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-500 text-[10px] uppercase">Payment Method:</span>
                    <span className="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-100">
                      {displaySale.paymentMethod}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">Reference: {displaySale.referenceNo}</div>
                  {displaySale.notes && <div className="text-[11px] text-slate-600 italic">Memo: {displaySale.notes}</div>}
                  <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5 text-emerald-700 text-[10px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Dedicated Materials Ledger • Fee Isolated
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">₦{displaySale.subtotal.toLocaleString()}</span>
                  </div>
                  {displaySale.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount:</span>
                      <span className="font-mono">-₦{displaySale.discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                    <span className="font-black text-slate-900 text-sm">Grand Total:</span>
                    <span className="font-mono font-black text-indigo-600 text-base">
                      ₦{displaySale.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-semibold pt-1">
                    <span>Amount Paid:</span>
                    <span className="font-mono text-emerald-700 font-bold">₦{amountPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Balance:</span>
                    <span className="font-mono font-bold text-slate-800">₦{balanceDue.toFixed(2)} (Fully Settled)</span>
                  </div>
                </div>
              </div>

              {/* MANDATORY STORE SALE WARNING NOTICE */}
              <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-3.5 text-xs space-y-1">
                <div className="flex items-center space-x-1.5 text-rose-800 font-black tracking-tight text-[11px]">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>STORE SALE ONLY — ISOLATED FROM SCHOOL FEES</span>
                </div>
                <p className="text-[10.5px] text-rose-700 leading-relaxed">
                  This receipt is strictly issued for counter/store purchases of school uniform fabrics, materials, and supplies.
                  <strong> Do not confuse this store receipt with a student tuition or school-fee receipt.</strong> No student fee ledger balances have been affected.
                </p>
              </div>

              {/* CASHIER SIGNATURE BLOCK */}
              <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-400 gap-4">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>SAMS Verified Store Issuance • Non-Refundable Cut Material</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-slate-500 font-semibold">Cashier: {displaySale.cashierName}</span>
                  <div className="w-40 border-b border-dashed border-slate-300 mt-3" />
                </div>
              </div>
            </div>
          ) : (
            /* THERMAL 80MM POS RECEIPT */
            <div id="printable-store-receipt-thermal" className="max-w-xs mx-auto bg-white p-5 rounded-xl border border-slate-300 shadow-sm font-mono text-xs text-slate-900 space-y-3">
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                <p className="font-black text-sm uppercase tracking-tight">{schoolName}</p>
                <p className="text-[10px] text-slate-500">{displaySale.store} • {displaySale.branch}</p>
                <div className="inline-block bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded my-1">
                  *** STORE SALE ***
                </div>
                <p className="text-xs font-bold text-indigo-600">{receiptNo}</p>
                <p className="text-[10px] text-slate-400">Txn: {txnNo}</p>
                <p className="text-[10px] text-slate-500">{displaySale.saleDate} {displaySale.time}</p>
              </div>

              {/* REPRINT BADGE */}
              {displaySale.reprintCount && displaySale.reprintCount > 0 ? (
                <div className="text-center font-bold text-[10px] text-rose-600 py-1 border-b border-dashed border-rose-300">
                  ** OFFICIAL REPRINT COPY #{displaySale.reprintCount} **
                </div>
              ) : null}

              {/* CUSTOMER INFO */}
              <div className="text-[11px] space-y-0.5 pb-2 border-b border-dashed border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold truncate max-w-[150px]">{displaySale.parentName}</span>
                </div>
                {displaySale.studentName && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Student:</span>
                    <span>{displaySale.studentName} {displaySale.admissionNo ? `[${displaySale.admissionNo}]` : ''}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Store:</span>
                  <span>{displaySale.store}</span>
                </div>
              </div>

              {/* ITEMS */}
              <div className="space-y-2 py-1 border-b border-dashed border-slate-300 text-xs">
                {displaySale.items.map((it, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-bold text-slate-800 text-[11px]">{it.itemName}</div>
                    <div className="flex justify-between text-slate-600 text-[10px]">
                      <span>{it.quantity} {it.unit} @ ₦{it.unitPrice.toLocaleString()}</span>
                      <span className="font-bold text-slate-900">₦{it.subtotal.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* TOTALS */}
              <div className="space-y-1 text-xs pt-1 border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₦{displaySale.subtotal.toLocaleString()}</span>
                </div>
                {displaySale.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-₦{displaySale.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1">
                  <span>GRAND TOTAL:</span>
                  <span>₦{displaySale.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] text-emerald-700 font-bold">
                  <span>Amount Paid:</span>
                  <span>₦{amountPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Balance:</span>
                  <span>₦{balanceDue.toFixed(2)} (Settled)</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                  <span>Payment:</span>
                  <span className="font-bold uppercase">{displaySale.paymentMethod}</span>
                </div>
              </div>

              <div className="text-center text-[9px] text-slate-500 pt-1 space-y-1">
                <p className="font-bold text-slate-700">STORE SALE ONLY - NOT A TUITION RECEIPT</p>
                <p>Cashier: {displaySale.cashierName}</p>
                <p className="font-semibold text-slate-600">Thank you for your patronage!</p>
              </div>
            </div>
          )}
        </div>

        {/* 4 PRIMARY IMMEDIATE OPTIONS ACTION BAR */}
        <div className="bg-white p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* LEFT: COPY SUMMARY & REPRINT REASON */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              {copied ? 'Copied Transcript!' : 'Copy Summary'}
            </button>

            {/* REPRINT RECEIPT (WITH AUDIT REASON PROMPT) */}
            <button
              onClick={() => setShowReprintModal(true)}
              className="px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-4 h-4 text-indigo-600" />
              Reprint Copy
            </button>
          </div>

          {/* RIGHT: THE 4 MANDATORY IMMEDIATE ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. PRINT RECEIPT */}
            <button
              onClick={() => handlePrint()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>

            {/* 2. GENERATE PDF */}
            <button
              onClick={handleGeneratePDF}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Generate PDF
            </button>

            {/* 3. SHARE VIA WHATSAPP */}
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              Share WhatsApp
            </button>

            {/* 4. SEND BY EMAIL */}
            <button
              onClick={() => setShowEmailModal(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              Send by Email
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* SUB-MODAL 1: SEND BY EMAIL DIALOG */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-5 space-y-4 font-sans">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Send Receipt by Email</h4>
                    <p className="text-[11px] text-slate-500">Transmits official electronic copy &amp; logs audit</p>
                  </div>
                </div>
                <button onClick={() => setShowEmailModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Recipient Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. parent@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Optional Cashier Note</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Thank you for purchasing student school supplies from SAMS store."
                    value={emailNote}
                    onChange={(e) => setEmailNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500 resize-none"
                  />
                </div>

                <div className="bg-sky-50 p-3 rounded-xl border border-sky-100 text-[11px] text-sky-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                    Electronic Audit Verification
                  </div>
                  <p className="text-[10.5px] text-sky-700">
                    Dispatches the verified itemized store voucher for {receiptNo} (Total: ₦{displaySale.totalAmount.toLocaleString()}) to {emailInput || 'parent'}.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={isSendingEmail || !emailInput.trim()}
                  className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isSendingEmail ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Email Receipt</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUB-MODAL 2: SHARE VIA WHATSAPP DIALOG */}
        {showWhatsAppModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-5 space-y-4 font-sans">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Share Receipt via WhatsApp</h4>
                    <p className="text-[11px] text-slate-500">Formats official transcript with 1-click delivery</p>
                  </div>
                </div>
                <button onClick={() => setShowWhatsAppModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Parent WhatsApp Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +234 803 123 4567"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Leave empty or enter custom number to share to any chat.</p>
                </div>

                {/* TRANSCRIPT PREVIEW */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">WhatsApp Message Preview</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-mono text-slate-700 max-h-36 overflow-y-auto whitespace-pre-wrap">
                    {generateWhatsAppText()}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShareWhatsApp}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Open in WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUB-MODAL 3: AUTHORIZED REPRINT WITH REASON */}
        {showReprintModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-5 space-y-4 font-sans">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Authorized Receipt Reprint</h4>
                    <p className="text-[11px] text-slate-500">Increments audit counter &amp; logs reprint reason</p>
                  </div>
                </div>
                <button onClick={() => setShowReprintModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Reprint Reason</label>
                  <select
                    value={reprintReason}
                    onChange={(e) => setReprintReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-rose-500 cursor-pointer"
                  >
                    <option value="Parent Requested Physical Duplicate">Parent Requested Physical Duplicate</option>
                    <option value="Accounting & Audit Verification Copy">Accounting &amp; Audit Verification Copy</option>
                    <option value="Damaged / Lost Original Replacement">Damaged / Lost Original Replacement</option>
                    <option value="School Store Management Inspection">School Store Management Inspection</option>
                    <option value="Custom Verification Review">Custom Verification Review</option>
                  </select>
                </div>

                <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 text-[11px] text-rose-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                    Strict Financial Audit Compliance
                  </div>
                  <p className="text-[10.5px] text-rose-700">
                    Reprinting will mark the physical document as <strong>[OFFICIAL REPRINT - COPY #{(displaySale.reprintCount || 0) + 1}]</strong> and append an entry in the store audit ledger with cashier signature ({displaySale.cashierName}).
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowReprintModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReprint}
                  disabled={isReprinting}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Execute Audited Reprint</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
