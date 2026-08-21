import React, { useState, useMemo } from 'react';
import { StoreSaleRecord } from '../../types/inventory';
import {
  Receipt,
  Search,
  Calendar,
  Building,
  CreditCard,
  Printer,
  ChevronRight,
  TrendingUp,
  Package,
  User,
  Filter,
  ShieldCheck,
  Percent,
  Clock,
  RotateCcw,
  Mail,
  MessageCircle,
  FileText
} from 'lucide-react';

interface StoreSalesHistoryProps {
  salesRecords: StoreSaleRecord[];
  onViewReceipt: (sale: StoreSaleRecord) => void;
}

export const StoreSalesHistory: React.FC<StoreSalesHistoryProps> = ({
  salesRecords,
  onViewReceipt
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('All');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All');

  const filteredSales = useMemo(() => {
    return salesRecords.filter(sale => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        sale.id.toLowerCase().includes(q) ||
        (sale.transactionNo && sale.transactionNo.toLowerCase().includes(q)) ||
        (sale.receiptNumber && sale.receiptNumber.toLowerCase().includes(q)) ||
        sale.parentName.toLowerCase().includes(q) ||
        (sale.studentName && sale.studentName.toLowerCase().includes(q)) ||
        (sale.admissionNo && sale.admissionNo.toLowerCase().includes(q)) ||
        (sale.parentPhone && sale.parentPhone.includes(q)) ||
        sale.referenceNo.toLowerCase().includes(q);

      const matchesStore = selectedStore === 'All' || sale.store === selectedStore;
      const matchesPayment = selectedPaymentMethod === 'All' || sale.paymentMethod === selectedPaymentMethod;

      return matchesSearch && matchesStore && matchesPayment;
    });
  }, [salesRecords, searchQuery, selectedStore, selectedPaymentMethod]);

  const stats = useMemo(() => {
    const totalVolume = salesRecords.length;
    const totalRevenue = salesRecords.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalPieces = salesRecords.reduce(
      (acc, s) => acc + s.items.reduce((sum, it) => sum + it.quantity, 0),
      0
    );
    const averageBasket = totalVolume > 0 ? Math.round(totalRevenue / totalVolume) : 0;
    return { totalVolume, totalRevenue, totalPieces, averageBasket };
  }, [salesRecords]);

  return (
    <div id="store-sales-history-view" className="space-y-5 font-sans">
      {/* SUMMARY STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sales Revenue</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">₦{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">{stats.totalVolume} processed receipts</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Units Dispensed</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{stats.totalPieces} items / meters</p>
            <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Sold to parents &amp; students</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Basket</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">₦{stats.averageBasket.toLocaleString()}</p>
            <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Per counter purchase</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fee Isolation Status</p>
            <p className="text-xl font-black text-purple-900 mt-0.5">100% Isolated</p>
            <p className="text-[10px] text-purple-600 font-semibold mt-0.5">Zero impact on tuition ledger</p>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Txn/Receipt #, Admission No, Student, Parent, Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-slate-400 font-semibold">Store:</span>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="All">All Stores</option>
              <option value="Uniform Depot">Uniform Depot</option>
              <option value="Main Storeroom">Main Storeroom</option>
              <option value="Bookstore">Bookstore</option>
              <option value="Sports Store">Sports Store</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-slate-400 font-semibold">Payment:</span>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="All">All Channels</option>
              <option value="POS Card">POS Card</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Student Wallet">Student Wallet</option>
            </select>
          </div>
        </div>
      </div>

      {/* SALES AUDIT TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Receipt # &amp; Time</th>
                <th className="px-5 py-3.5">Customer / Student Record</th>
                <th className="px-5 py-3.5">Store Location</th>
                <th className="px-5 py-3.5">Purchased Items &amp; Units</th>
                <th className="px-5 py-3.5 text-center">Payment</th>
                <th className="px-5 py-3.5 text-right">Total Paid</th>
                <th className="px-5 py-3.5 text-right">Receipt Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-slate-700">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                    No store sale transactions recorded yet.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const receiptId = sale.receiptNumber || `RCP-${sale.transactionNo || sale.id}`;
                  const isReprinted = sale.reprintCount && sale.reprintCount > 0;
                  const hasEmail = sale.emailDispatchedTo && sale.emailDispatchedTo.length > 0;
                  const hasWhatsApp = sale.whatsAppDispatchedTo && sale.whatsAppDispatchedTo.length > 0;

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-indigo-600">{receiptId}</span>
                          <span className="bg-indigo-50 text-indigo-700 text-[9px] font-extrabold px-1.5 py-0.2 rounded border border-indigo-100">
                            STORE SALE
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5 font-mono">
                          Txn: {sale.transactionNo || sale.id}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">{sale.saleDate} • {sale.time}</div>

                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-block">
                            Fee Isolated
                          </span>
                          {isReprinted && (
                            <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 inline-flex items-center gap-0.5">
                              <RotateCcw className="w-2.5 h-2.5" />
                              Copy #{sale.reprintCount}
                            </span>
                          )}
                          {hasEmail && (
                            <span className="text-[9px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200 inline-flex items-center gap-0.5" title={`Emailed to ${sale.emailDispatchedTo?.join(', ')}`}>
                              <Mail className="w-2.5 h-2.5" />
                              Emailed
                            </span>
                          )}
                          {hasWhatsApp && (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-flex items-center gap-0.5" title={`WhatsApp shared to ${sale.whatsAppDispatchedTo?.join(', ')}`}>
                              <MessageCircle className="w-2.5 h-2.5" />
                              WhatsApp
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-extrabold text-slate-900">{sale.parentName}</div>
                        {sale.studentName && (
                          <div className="text-[11px] text-slate-600">
                            Student: <span className="font-bold text-slate-800">{sale.studentName}</span>
                            {sale.admissionNo && (
                              <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 font-bold ml-1">
                                {sale.admissionNo}
                              </span>
                            )}
                            {sale.grade && <span className="text-slate-400 ml-1">({sale.grade})</span>}
                          </div>
                        )}
                        {sale.parentPhone && <div className="font-mono text-[10px] text-slate-400">{sale.parentPhone}</div>}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">{sale.store}</div>
                        <div className="text-[10px] text-slate-400">{sale.branch}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Cashier: {sale.cashierName}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-0.5 max-w-xs">
                          {sale.items.map((it, idx) => (
                            <div key={idx} className="text-[11px] flex items-center justify-between text-slate-600">
                              <span className="truncate pr-2 font-medium">{it.itemName}</span>
                              <span className="font-mono font-bold text-slate-800 shrink-0">
                                {it.quantity} {it.unit.toLowerCase()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          {sale.paymentMethod}
                        </span>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">{sale.referenceNo}</div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          ₦{sale.totalAmount.toLocaleString()}
                        </span>
                        {sale.discountAmount > 0 && (
                          <div className="text-[10px] text-amber-600 font-bold">
                            -₦{sale.discountAmount.toLocaleString()} disc
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => onViewReceipt(sale)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          View Receipt
                        </button>
                      </td>
                    </tr>
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
