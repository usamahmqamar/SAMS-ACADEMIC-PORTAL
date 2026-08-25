import React from 'react';
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  Truck,
  ArrowRightLeft,
  BookOpen,
  PlusCircle,
  ClipboardList,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export interface StoreManagerDashboardData {
  totalStockValue: number;
  lowStockCount: number;
  todaySalesAmount: number;
  todaySalesCount: number;
  recentPurchasesTotal: number;
  goodsReceivedNotesCount: number;
  pendingTransfersCount: number;
  booksPendingIssuanceCount: number;
  lowStockItems: {
    id: string;
    sku: string;
    itemName: string;
    category: string;
    currentQuantity: number;
    reorderLevel: number;
  }[];
}

interface StoreManagerDashboardProps {
  data: StoreManagerDashboardData | null;
  loading: boolean;
  branchName: string;
  onNavigateTab: (tab: string, submenu?: string) => void;
  onOpenNewSale: () => void;
  onOpenReceiveStock: () => void;
  onOpenIssueMaterials: () => void;
  onOpenInventoryCatalog: () => void;
}

export const StoreManagerDashboard: React.FC<StoreManagerDashboardProps> = ({
  data,
  loading,
  branchName,
  onNavigateTab,
  onOpenNewSale,
  onOpenReceiveStock,
  onOpenIssueMaterials,
  onOpenInventoryCatalog
}) => {
  const formatNaira = (val?: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    }).format(Number(val || 0));
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50" />
          ))}
        </div>
      </div>
    );
  }

  const d = data || {
    totalStockValue: 0,
    lowStockCount: 0,
    todaySalesAmount: 0,
    todaySalesCount: 0,
    recentPurchasesTotal: 0,
    goodsReceivedNotesCount: 0,
    pendingTransfersCount: 0,
    booksPendingIssuanceCount: 0,
    lowStockItems: []
  };

  return (
    <div className="space-y-6">
      {/* Quick Store Action Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-slate-800 rounded-xl">
            <Package className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">Store & Inventory Console</h3>
            <p className="text-[11px] text-slate-300">
              Campus: <span className="font-semibold text-white">{branchName}</span> | Warehouse Logistics
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenNewSale}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>New Sale</span>
          </button>

          <button
            type="button"
            onClick={onOpenReceiveStock}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-white/20 cursor-pointer"
          >
            <Truck className="w-4 h-4" />
            <span>Receive Stock (GRN)</span>
          </button>

          <button
            type="button"
            onClick={onOpenIssueMaterials}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-white/20 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Issue Materials</span>
          </button>

          <button
            type="button"
            onClick={onOpenInventoryCatalog}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-white/20 cursor-pointer"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Catalog Items</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Valuation */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Stock Valuation</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {formatNaira(d.totalStockValue)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">Warehouse Inventory</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock SKUs</p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{d.lowStockCount}</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Below Reorder Buffer</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Today's Sales Counter */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Uniform/Book Sales</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatNaira(d.todaySalesAmount)}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">{d.todaySalesCount} Over-the-counter orders</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Transfers & Orders */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending GRN & Transfers</p>
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
              {d.goodsReceivedNotesCount + d.pendingTransfersCount}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">Inbound Shipments</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid: Low Stock Alert Table & Logistics Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Item Buffer Table */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Critical Low Stock Alerts</h3>
              <p className="text-xs text-slate-500">Items requiring immediate requisition or purchase order dispatch</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('inventory', 'inventory_levels')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Levels</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">In Stock</th>
                  <th className="py-2.5 px-3 text-right">Reorder Min</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {d.lowStockItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                      All inventory stock levels are currently within safe operating thresholds.
                    </td>
                  </tr>
                ) : (
                  d.lowStockItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-600 dark:text-slate-400">{item.sku}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{item.itemName}</td>
                      <td className="py-2.5 px-3 text-slate-500">{item.category}</td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-rose-600 dark:text-rose-400">
                        {item.currentQuantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        {item.reorderLevel}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Books & Materials Distribution Brief */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Books & Material Issuance</h3>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Books Pending Issuance:</span>
              <span className="font-extrabold text-amber-600 dark:text-amber-400">
                {d.booksPendingIssuanceCount} units
              </span>
            </div>

            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700">
              <span className="text-slate-500">Pending Inter-Branch Transfers:</span>
              <span className="font-extrabold text-blue-600 dark:text-blue-400">
                {d.pendingTransfersCount} transfers
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigateTab('inventory', 'inventory_issuance')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
            >
              Open Issuance Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreManagerDashboard;
