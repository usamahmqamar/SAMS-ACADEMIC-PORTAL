import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Calendar, 
  CalendarDays, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Sparkles, 
  ChevronRight, 
  User, 
  BookOpen, 
  Award, 
  Target, 
  Percent, 
  Briefcase, 
  Info,
  Layers,
  Search,
  RefreshCw,
  Bell,
  ArrowUpRight
} from 'lucide-react';
import * as Lucide from 'lucide-react';

function DynamicLucideIcon({ name, className = "w-4 h-4" }: { name: string; className?: string }) {
  const IconComponent = (Lucide as any)[name] || Lucide.Activity;
  return <IconComponent className={className} />;
}

interface EventBudgetItem {
  id: string;
  name: string;
  category: string;
  cost: number;
}

interface EventBudget {
  id: string;
  eventId: string;
  eventName: string;
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  status: string;
  items: EventBudgetItem[];
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stockQuantity: number;
  unit: string;
}

interface ReadinessCheckItem {
  itemId: string;
  name: string;
  requiredQuantity: number;
  availableQuantity: number;
  status: 'available' | 'shortage';
}

interface InventoryReadinessCheck {
  id: string;
  eventId: string;
  eventName: string;
  activityDate: string;
  status: 'ready' | 'warning' | 'critical';
  notes: string;
  items: ReadinessCheckItem[];
  lastChecked: string;
}

interface DashboardData {
  today: string;
  eventBudgets: EventBudget[];
  inventory: InventoryItem[];
  inventoryReadiness: InventoryReadinessCheck[];
  currentlyHappening: {
    currentEvents: any[];
    currentCampaigns: any[];
    currentDeadlines: any[];
  };
  upcoming: {
    upcomingEvents: any[];
    upcomingExams: any[];
    upcomingFeeDrives: any[];
  };
  overdue: {
    overdueTasks: any[];
    missedDeadlines: any[];
  };
  sessionSummary: {
    currentWeek: number;
    currentTerm: {
      id: string;
      name: string;
      startDate: string;
      endDate: string;
      numberOfWeeks: number;
    };
    sessionProgress: number;
    activeSession: {
      id: string;
      name: string;
      startDate: string;
      endDate: string;
      status: string;
    };
    weeksCompleted: number;
    weeksRemaining: number;
    totalSessionWeeks: number;
  };
  stats: {
    totalTasksCount: number;
    completedTasksCount: number;
    overdueTasksCount: number;
    totalCampaignTarget: number;
    totalCampaignActual: number;
    taskChartData: Array<{ name: string; value: number; color: string }>;
    feeCampaignChartData: Array<{ name: string; Target: number; Collected: number }>;
    categoryChartData: Array<{ name: string; count: number; color: string }>;
  };
}

export default function OperationsDashboard({ activeBranch }: { activeBranch: 'GN' | 'RS' }) {
  const [simulatedDate, setSimulatedDate] = useState<string>("2026-07-04");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Detail Modals State
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  // Event Budget States
  const [selectedBudget, setSelectedBudget] = useState<EventBudget | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isManageBudgetOpen, setIsManageBudgetOpen] = useState<boolean>(false);
  const [budgetSearchQuery, setBudgetSearchQuery] = useState<string>("");
  const [budgetStatusFilter, setBudgetStatusFilter] = useState<string>("all");
  
  // New Event Budget Creation State
  const [isCreateBudgetOpen, setIsCreateBudgetOpen] = useState<boolean>(false);
  const [newBudgetEventId, setNewBudgetEventId] = useState<string>("");
  const [newBudgetEventName, setNewBudgetEventName] = useState<string>("");
  const [newBudgetAmount, setNewBudgetAmount] = useState<number>(5000);

  // Budget Item Form State
  const [newItemName, setNewItemName] = useState<string>("");
  const [newItemCategory, setNewItemCategory] = useState<string>("Equipment");
  const [newItemCost, setNewItemCost] = useState<string>("");
  const [editingBudgetLimit, setEditingBudgetLimit] = useState<string>("");

  // Chart Tooltips/Hovers State
  const [hoveredFeeIndex, setHoveredFeeIndex] = useState<number | null>(null);
  const [hoveredTaskIndex, setHoveredTaskIndex] = useState<number | null>(null);

  // Inventory & Readiness Control Center States
  const [activeInventoryTab, setActiveInventoryTab] = useState<'readiness' | 'items' | 'alerts'>('readiness');
  const [inventorySearchQuery, setInventorySearchQuery] = useState<string>("");
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>("all");
  
  // Create Inventory Item Modal State
  const [isCreateInventoryOpen, setIsCreateInventoryOpen] = useState<boolean>(false);
  const [newInvName, setNewInvName] = useState<string>("");
  const [newInvCategory, setNewInvCategory] = useState<string>("Academic");
  const [newInvQuantity, setNewInvQuantity] = useState<number>(100);
  const [newInvUnit, setNewInvUnit] = useState<string>("units");

  // Create Readiness Checklist Modal State
  const [isCreateReadinessOpen, setIsCreateReadinessOpen] = useState<boolean>(false);
  const [newRcEventId, setNewRcEventId] = useState<string>("");
  const [newRcEventName, setNewRcEventName] = useState<string>("");
  const [newRcActivityDate, setNewRcActivityDate] = useState<string>("2026-07-12");
  const [newRcNotes, setNewRcNotes] = useState<string>("");
  const [newRcChecklistItems, setNewRcChecklistItems] = useState<Array<{ itemId: string; name: string; requiredQuantity: number; availableQuantity: number }>>([]);

  // Temp item builder states for the modal
  const [tempChecklistItemId, setTempChecklistItemId] = useState<string>("");
  const [tempChecklistName, setTempChecklistName] = useState<string>("");
  const [tempChecklistRequired, setTempChecklistRequired] = useState<number>(10);

  // Manage/Edit Active Readiness Checklist Modal State
  const [selectedReadinessCheck, setSelectedReadinessCheck] = useState<InventoryReadinessCheck | null>(null);
  const [isManageReadinessOpen, setIsManageReadinessOpen] = useState<boolean>(false);
  const [editRcNotes, setEditRcNotes] = useState<string>("");
  const [newChecklistRequirementName, setNewChecklistRequirementName] = useState<string>("");
  const [newChecklistRequirementId, setNewChecklistRequirementId] = useState<string>("");
  const [newChecklistRequirementQty, setNewChecklistRequirementQty] = useState<number>(10);

  const handleAddBudgetItem = async () => {
    if (!selectedBudget || !newItemName || !newItemCost) return;
    try {
      const updatedItems = [
        ...(selectedBudget.items || []),
        {
          id: `eb-item-${Date.now()}`,
          name: newItemName,
          category: newItemCategory,
          cost: Number(newItemCost) || 0
        }
      ];

      const res = await fetch(`/api/event_budgets/${selectedBudget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: updatedItems
        })
      });

      if (!res.ok) throw new Error("Failed to add budget item");
      const updatedBudget = await res.json();
      
      // Update local state
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          eventBudgets: (prev.eventBudgets || []).map(b => b.id === updatedBudget.id ? updatedBudget : b)
        };
      });
      setSelectedBudget(updatedBudget);
      setNewItemName("");
      setNewItemCost("");
    } catch (err) {
      console.error(err);
      alert("Could not append budget line item.");
    }
  };

  const handleDeleteBudgetItem = async (itemId: string) => {
    if (!selectedBudget) return;
    try {
      const updatedItems = (selectedBudget.items || []).filter(it => it.id !== itemId);

      const res = await fetch(`/api/event_budgets/${selectedBudget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: updatedItems
        })
      });

      if (!res.ok) throw new Error("Failed to delete budget item");
      const updatedBudget = await res.json();

      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          eventBudgets: (prev.eventBudgets || []).map(b => b.id === updatedBudget.id ? updatedBudget : b)
        };
      });
      setSelectedBudget(updatedBudget);
    } catch (err) {
      console.error(err);
      alert("Could not remove budget line item.");
    }
  };

  const handleUpdateBudgetLimit = async () => {
    if (!selectedBudget || !editingBudgetLimit) return;
    try {
      const res = await fetch(`/api/event_budgets/${selectedBudget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalBudget: Number(editingBudgetLimit) || 0
        })
      });

      if (!res.ok) throw new Error("Failed to update budget limit");
      const updatedBudget = await res.json();

      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          eventBudgets: (prev.eventBudgets || []).map(b => b.id === updatedBudget.id ? updatedBudget : b)
        };
      });
      setSelectedBudget(updatedBudget);
      setEditingBudgetLimit("");
    } catch (err) {
      console.error(err);
      alert("Could not update total budget allocation.");
    }
  };

  const handleCreateNewBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudgetEventName && !newBudgetEventId) return;
    
    // Check if event is picked from dropdown
    let finalEventName = newBudgetEventName;
    if (newBudgetEventId) {
      const foundEvent = (data?.currentlyHappening.currentEvents || [])
        .concat(data?.upcoming.upcomingEvents || [])
        .find(ev => ev.id === newBudgetEventId);
      if (foundEvent) {
        finalEventName = foundEvent.title;
      }
    }

    try {
      const res = await fetch('/api/event_budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: newBudgetEventId,
          eventName: finalEventName,
          totalBudget: Number(newBudgetAmount) || 0,
          items: []
        })
      });

      if (!res.ok) throw new Error("Failed to create new event budget");
      const createdBudget = await res.json();

      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          eventBudgets: [...(prev.eventBudgets || []), createdBudget]
        };
      });

      setIsCreateBudgetOpen(false);
      setNewBudgetEventId("");
      setNewBudgetEventName("");
      setNewBudgetAmount(5000);
    } catch (err) {
      console.error(err);
      alert("Could not create new event budget.");
    }
  };

  // -------------------------------------------------------------
  // INVENTORY AND READINESS ACTION HANDLERS
  // -------------------------------------------------------------

  // 1. Create New Inventory Item
  const handleCreateInventoryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvName) return;
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newInvName,
          category: newInvCategory,
          stockQuantity: Number(newInvQuantity) || 0,
          unit: newInvUnit
        })
      });
      if (!res.ok) throw new Error("Failed to create item");
      const newItem = await res.json();

      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          inventory: [...(prev.inventory || []), newItem]
        };
      });

      setIsCreateInventoryOpen(false);
      setNewInvName("");
      setNewInvQuantity(100);
      setNewInvUnit("units");
    } catch (err) {
      console.error(err);
      alert("Could not register new inventory item.");
    }
  };

  // 2. Quick Update Stock Quantity
  const handleUpdateStockQuantity = async (itemId: string, newQty: number) => {
    try {
      const res = await fetch(`/api/inventory/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: newQty })
      });
      if (!res.ok) throw new Error("Failed to update stock");
      const updatedItem = await res.json();

      // Update both inventory and readiness checks (the backend auto-recalculates check statuses)
      setData(prev => {
        if (!prev) return prev;
        
        // Update item in list
        const updatedInv = (prev.inventory || []).map(it => it.id === itemId ? updatedItem : it);
        
        // Sync readiness checks quantities and statuses
        const updatedRc = (prev.inventoryReadiness || []).map(rc => {
          let checkChanged = false;
          const updatedCheckitems = rc.items.map(it => {
            if (it.itemId === itemId) {
              const qty = Number(newQty);
              checkChanged = true;
              return {
                ...it,
                availableQuantity: qty,
                status: qty >= it.requiredQuantity ? ('available' as const) : ('shortage' as const)
              };
            }
            return it;
          });

          if (checkChanged) {
            const hasShortage = updatedCheckitems.some(it => it.status === "shortage");
            return {
              ...rc,
              items: updatedCheckitems,
              status: hasShortage ? ('warning' as const) : ('ready' as const)
            };
          }
          return rc;
        });

        return {
          ...prev,
          inventory: updatedInv,
          inventoryReadiness: updatedRc
        };
      });

      if (selectedReadinessCheck) {
        // Also sync selected checklist modal state if open
        setSelectedReadinessCheck(prev => {
          if (!prev) return prev;
          const updatedItems = prev.items.map(it => {
            if (it.itemId === itemId) {
              const qty = Number(newQty);
              return {
                ...it,
                availableQuantity: qty,
                status: qty >= it.requiredQuantity ? ('available' as const) : ('shortage' as const)
              };
            }
            return it;
          });
          const hasShortage = updatedItems.some(it => it.status === "shortage");
          return {
            ...prev,
            items: updatedItems,
            status: hasShortage ? 'warning' : 'ready'
          };
        });
      }
    } catch (err) {
      console.error(err);
      alert("Could not update item stock levels.");
    }
  };

  // 3. Delete Inventory Item
  const handleDeleteInventoryItem = async (itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this inventory item?")) return;
    try {
      const res = await fetch(`/api/inventory/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete inventory item");
      
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          inventory: (prev.inventory || []).filter(it => it.id !== itemId)
        };
      });
    } catch (err) {
      console.error(err);
      alert("Could not remove inventory item.");
    }
  };

  // 4. Create New Activity Readiness Checklist
  const handleCreateReadinessCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRcEventName && !newRcEventId) return;

    let finalEventName = newRcEventName;
    if (newRcEventId) {
      const foundEvent = (data?.currentlyHappening.currentEvents || [])
        .concat(data?.upcoming.upcomingEvents || [])
        .find(ev => ev.id === newRcEventId);
      if (foundEvent) {
        finalEventName = foundEvent.title;
      }
    }

    try {
      const res = await fetch('/api/inventory_readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: newRcEventId,
          eventName: finalEventName,
          activityDate: newRcActivityDate,
          notes: newRcNotes,
          items: newRcChecklistItems
        })
      });
      if (!res.ok) throw new Error("Failed to create check");
      const createdCheck = await res.json();

      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          inventoryReadiness: [...(prev.inventoryReadiness || []), createdCheck]
        };
      });

      setIsCreateReadinessOpen(false);
      setNewRcEventId("");
      setNewRcEventName("");
      setNewRcNotes("");
      setNewRcChecklistItems([]);
    } catch (err) {
      console.error(err);
      alert("Could not schedule event readiness check.");
    }
  };

  // 5. Delete Readiness Check
  const handleDeleteReadinessCheck = async (rcId: string) => {
    if (!window.confirm("Are you sure you want to delete this activity readiness check?")) return;
    try {
      const res = await fetch(`/api/inventory_readiness/${rcId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete check");

      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          inventoryReadiness: (prev.inventoryReadiness || []).filter(rc => rc.id !== rcId)
        };
      });
    } catch (err) {
      console.error(err);
      alert("Could not remove event readiness check.");
    }
  };

  // 6. Quick Add Line Item Requirement to Selected Readiness Checklist
  const handleAddReadinessChecklistRequirement = async () => {
    if (!selectedReadinessCheck || (!newChecklistRequirementName && !newChecklistRequirementId)) return;

    let finalItemName = newChecklistRequirementName;
    let finalItemId = newChecklistRequirementId;
    let currentStock = 0;

    if (newChecklistRequirementId) {
      const matchedInv = (data?.inventory || []).find(it => it.id === newChecklistRequirementId);
      if (matchedInv) {
        finalItemName = matchedInv.name;
        currentStock = matchedInv.stockQuantity;
      }
    }

    const newItem = {
      itemId: finalItemId,
      name: finalItemName,
      requiredQuantity: Number(newChecklistRequirementQty) || 1,
      availableQuantity: finalItemId ? currentStock : Number(newChecklistRequirementQty) || 1
    };

    const updatedChecklistItems = [
      ...(selectedReadinessCheck.items || []),
      newItem
    ];

    try {
      const res = await fetch(`/api/inventory_readiness/${selectedReadinessCheck.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: updatedChecklistItems
        })
      });
      if (!res.ok) throw new Error("Failed to add checklist item");
      const updatedCheck = await res.json();

      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          inventoryReadiness: (prev.inventoryReadiness || []).map(rc => rc.id === updatedCheck.id ? updatedCheck : rc)
        };
      });

      setSelectedReadinessCheck(updatedCheck);
      setNewChecklistRequirementName("");
      setNewChecklistRequirementId("");
      setNewChecklistRequirementQty(10);
    } catch (err) {
      console.error(err);
      alert("Could not insert requirement into active checklist.");
    }
  };

  // 7. Delete Item from Selected Checklist
  const handleDeleteReadinessChecklistRequirement = async (itemNameOrId: string) => {
    if (!selectedReadinessCheck) return;
    const updatedChecklistItems = (selectedReadinessCheck.items || []).filter(
      it => it.itemId !== itemNameOrId && it.name !== itemNameOrId
    );

    try {
      const res = await fetch(`/api/inventory_readiness/${selectedReadinessCheck.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: updatedChecklistItems
        })
      });
      if (!res.ok) throw new Error("Failed to delete checklist item");
      const updatedCheck = await res.json();

      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          inventoryReadiness: (prev.inventoryReadiness || []).map(rc => rc.id === updatedCheck.id ? updatedCheck : rc)
        };
      });

      setSelectedReadinessCheck(updatedCheck);
    } catch (err) {
      console.error(err);
      alert("Could not remove item from checklist.");
    }
  };

  // 8. Update Checklist Notes
  const handleUpdateChecklistNotes = async () => {
    if (!selectedReadinessCheck) return;
    try {
      const res = await fetch(`/api/inventory_readiness/${selectedReadinessCheck.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: editRcNotes
        })
      });
      if (!res.ok) throw new Error("Failed to update notes");
      const updatedCheck = await res.json();

      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          inventoryReadiness: (prev.inventoryReadiness || []).map(rc => rc.id === updatedCheck.id ? updatedCheck : rc)
        };
      });

      setSelectedReadinessCheck(updatedCheck);
      alert("Checklist notes saved successfully.");
    } catch (err) {
      console.error(err);
      alert("Could not save checklist notes.");
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [simulatedDate, activeBranch]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch dynamic operations dashboard metrics based on simulated date and active branch filter
      const res = await fetch(`/api/operations/dashboard?date=${simulatedDate}&branch=${activeBranch}`);
      if (!res.ok) {
        throw new Error("Failed to load school operations telemetry");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError("Operations telemetry could not be resolved from the server.");
    } finally {
      setLoading(false);
    }
  };

  // Quick date jump presets to make testing extremely satisfying
  const datePresets = [
    { label: "Mid-Term Review (July 1)", date: "2026-07-01" },
    { label: "Default Today (July 4)", date: "2026-07-04" },
    { label: "Final Examinations (July 12)", date: "2026-07-12" },
    { label: "Term Clearance (July 18)", date: "2026-07-18" },
  ];

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-150 rounded-2xl p-6 text-center text-rose-800 max-w-2xl mx-auto my-12 shadow-sm">
        <AlertTriangle className="w-12 h-12 mx-auto text-rose-500 mb-4 animate-bounce" />
        <h3 className="font-bold text-lg mb-2">Operations Center Offline</h3>
        <p className="text-sm text-rose-600/90 mb-4">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-colors inline-flex items-center space-x-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Sync</span>
        </button>
      </div>
    );
  }

  return (
    <div id="ops-dashboard-root" className="space-y-6">
      
      {/* =========================================================
          OPERATIONAL TIME CONTROL BAR
          ========================================================= */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border border-indigo-100">
              🚀 Operations Time Machine
            </span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              School Operations Timeline Controller
            </h2>
            <p className="text-xs text-slate-500">
              Scrub or preset dates to observe dynamic shifts in active events, campaigns, exam periods, and overdue deadlines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 p-2 rounded-xl">
              <span className="text-xs font-bold text-slate-600 pl-2">Timeline Date:</span>
              <input 
                type="date"
                value={simulatedDate}
                onChange={(e) => setSimulatedDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 px-3 py-1.5 outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Presets Grid */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Time Jumps:</span>
          {datePresets.map((preset) => (
            <button
              key={preset.date}
              onClick={() => setSimulatedDate(preset.date)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                simulatedDate === preset.date 
                  ? 'bg-indigo-600 text-white shadow-xs font-bold ring-2 ring-indigo-200' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Aggregating system operations stats...</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          
          {/* =========================================================
              SESSION & TERM SUMMARY BAR
              ========================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* KPI 1: TERM & WEEK INDEX */}
            <div className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-2xl border border-slate-200/85 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-100 uppercase tracking-wider">
                    Academic Framework
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-2">
                    {data.sessionSummary.currentTerm.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Active Operations Window
                  </p>
                </div>
                <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-indigo-700">
                    Week {data.sessionSummary.currentWeek}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    of {data.sessionSummary.currentTerm.numberOfWeeks} Weeks
                  </span>
                </div>
                
                {/* Visual weeks dots */}
                <div className="flex items-center space-x-1 mt-3">
                  {Array.from({ length: data.sessionSummary.currentTerm.numberOfWeeks }).map((_, idx) => (
                    <div 
                      key={idx}
                      className={`h-2 rounded-full flex-1 transition-all ${
                        idx + 1 === data.sessionSummary.currentWeek 
                          ? 'bg-indigo-600 ring-2 ring-indigo-200' 
                          : idx + 1 < data.sessionSummary.currentWeek 
                            ? 'bg-indigo-400' 
                            : 'bg-slate-200'
                      }`}
                      title={`Week ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* KPI 2: SESSION PROGRESS MONITOR */}
            <div className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-2xl border border-slate-200/85 shadow-xs flex flex-col justify-between relative overflow-hidden group">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-100 uppercase tracking-wider">
                    Session Progress Monitor
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-2 flex items-center gap-1.5">
                    {data.sessionSummary.activeSession.name}
                    <span className="text-xs bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded border border-emerald-100">
                      Active
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Academic Year Progression Tracker
                  </p>
                </div>
                <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4 space-y-3.5">
                {/* Visual Progress Stats */}
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <span className="text-3xl font-black text-slate-900">
                      {data.sessionSummary.sessionProgress}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                      Year Completed
                    </span>
                  </div>
                  <div className="text-right text-xs text-slate-500 font-medium space-y-0.5">
                    <div>
                      <span className="font-bold text-slate-700">{data.sessionSummary.weeksCompleted}</span> Weeks Completed
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">{data.sessionSummary.weeksRemaining}</span> Weeks Remaining
                    </div>
                  </div>
                </div>

                {/* Progress Bar with Tooltip */}
                <div className="relative">
                  <div className="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${data.sessionSummary.sessionProgress}%` }}
                    />
                  </div>
                </div>

                {/* Term and Week Badges */}
                <div className="grid grid-cols-2 gap-2 bg-white/70 border border-slate-100 rounded-xl p-2 text-center text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[9px] font-bold uppercase">Current Term</span>
                    <span className="font-bold text-slate-800">{data.sessionSummary.currentTerm.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] font-bold uppercase">Current Week</span>
                    <span className="font-bold text-indigo-600">Week {data.sessionSummary.currentWeek}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI 3: OPERATIONAL STATS COUNTER */}
            <div className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-2xl border border-slate-200/85 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] bg-purple-50 text-purple-700 font-extrabold px-2.5 py-0.5 rounded-full border border-purple-100 uppercase tracking-wider">
                    Execution Auditing
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-2">
                    Operations Health Desk
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Institutional Task Completion Ratio
                  </p>
                </div>
                <div className="bg-purple-50 text-purple-600 p-2.5 rounded-xl">
                  <Activity className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-100 p-2 rounded-xl text-center shadow-2xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tasks Completed</p>
                  <p className="text-xl font-extrabold text-indigo-600 mt-0.5">
                    {data.stats.completedTasksCount} / {data.stats.totalTasksCount}
                  </p>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                    <div 
                      className="bg-indigo-500 h-full"
                      style={{ width: `${(data.stats.completedTasksCount / (data.stats.totalTasksCount || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-2 rounded-xl text-center shadow-2xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Arrears Collected</p>
                  <p className="text-xl font-extrabold text-emerald-600 mt-0.5">
                    {Math.round((data.stats.totalCampaignActual / (data.stats.totalCampaignTarget || 1)) * 100)}%
                  </p>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                    <div 
                      className="bg-emerald-500 h-full"
                      style={{ width: `${(data.stats.totalCampaignActual / (data.stats.totalCampaignTarget || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* =========================================================
              SESSION PROGRESS MONITOR: ROADMAP & TIMELINE INTEGRATION
              ========================================================= */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border border-indigo-100">
                  📅 Academic Year Roadmap
                </span>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Interactive Session Week Tracker & Milestones
                </h3>
                <p className="text-xs text-slate-500">
                  Detailed timeline mapping out {data.sessionSummary.totalSessionWeeks} calendar weeks of the {data.sessionSummary.activeSession.name}. Observe completed, active, and upcoming milestones.
                </p>
              </div>

              {/* Status Legends */}
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-600 animate-pulse" />
                  <span>Current Week</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-200" />
                  <span>Remaining</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                  <span>Exams Window</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-sky-400" />
                  <span>Holidays/Breaks</span>
                </div>
              </div>
            </div>

            {/* Scrollable Track or Dense Grid representing the timeline */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 xl:grid-cols-12 gap-2 pt-2">
              {Array.from({ length: data.sessionSummary.totalSessionWeeks }).map((_, idx) => {
                const weekNum = idx + 1;
                
                // Determine block type and labels
                let isHoliday = false;
                let isExam = false;
                let phaseName = "";
                let weekLabel = `Week ${weekNum}`;

                // Map weeks to academic terms and breaks
                if (weekNum <= 15) {
                  phaseName = "First Term";
                  if (weekNum === 15) {
                    isExam = true;
                    weekLabel = "T1 Exams";
                  }
                } else if (weekNum === 16 || weekNum === 17) {
                  phaseName = "Winter Break";
                  isHoliday = true;
                  weekLabel = "Holiday";
                } else if (weekNum >= 18 && weekNum <= 30) {
                  phaseName = "Second Term";
                  const termWeek = weekNum - 17;
                  if (termWeek === 13) {
                    isExam = true;
                    weekLabel = "T2 Exams";
                  } else {
                    weekLabel = `T2 W${termWeek}`;
                  }
                } else if (weekNum === 31) {
                  phaseName = "Spring Break";
                  isHoliday = true;
                  weekLabel = "Holiday";
                } else if (weekNum >= 32 && weekNum <= 44) {
                  phaseName = "Third Term";
                  const termWeek = weekNum - 31;
                  if (termWeek === 12 || termWeek === 13) {
                    isExam = true;
                    weekLabel = `T3 Exams`;
                  } else {
                    weekLabel = `T3 W${termWeek}`;
                  }
                } else {
                  phaseName = "Summer Break";
                  isHoliday = true;
                  weekLabel = "Summer";
                }

                // Status relative to active pointer
                const isCompleted = weekNum <= data.sessionSummary.weeksCompleted;
                const isActive = weekNum === data.sessionSummary.weeksCompleted + 1;

                return (
                  <div 
                    key={weekNum}
                    className={`p-2 rounded-xl border text-center transition-all relative group/week ${
                      isActive 
                        ? 'bg-indigo-600 border-indigo-700 text-white font-bold ring-4 ring-indigo-100 shadow-md scale-[1.03] z-10' 
                        : isCompleted
                          ? 'bg-emerald-50 border-emerald-150 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {/* Top phase tooltip tag */}
                    <div className="text-[8px] font-extrabold tracking-wider uppercase opacity-80 truncate block">
                      {phaseName}
                    </div>

                    {/* Week Number or Short Label */}
                    <div className="text-xs font-black tracking-tight mt-1 flex items-center justify-center gap-1">
                      {isCompleted && !isActive && <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />}
                      <span>{weekLabel}</span>
                    </div>

                    {/* Status badges */}
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {isExam && (
                        <span className={`text-[8px] font-bold uppercase px-1 rounded ${isActive ? 'bg-amber-400 text-indigo-950' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                          EXAM
                        </span>
                      )}
                      {isHoliday && (
                        <span className={`text-[8px] font-bold uppercase px-1 rounded ${isActive ? 'bg-sky-400 text-slate-950' : 'bg-sky-50 text-sky-700 border border-sky-100'}`}>
                          BREAK
                        </span>
                      )}
                    </div>

                    {/* Fancy Hover Details Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/week:block bg-slate-950 text-white text-[10px] p-2 rounded-lg shadow-xl w-36 text-left z-20 transition-all">
                      <div className="font-extrabold text-indigo-400 border-b border-slate-800 pb-1 mb-1">
                        Session Week {weekNum}
                      </div>
                      <div className="space-y-0.5 font-medium text-slate-300">
                        <div>Phase: {phaseName}</div>
                        <div>Status: {
                          isActive ? "Active Week" : isCompleted ? "Completed" : "Upcoming"
                        }</div>
                        {isExam && <div>Event: Term Assessment</div>}
                        {isHoliday && <div>Event: Academic Holiday</div>}
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-950" />
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* =========================================================
              EVENT BUDGET MONITORING SYSTEM
              ========================================================= */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-100">
                  💰 Financial Controls
                </span>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Event Budget & Spending Monitor
                </h3>
                <p className="text-xs text-slate-500">
                  Track allocated budgets, real-time expenditures, and variances for Sports Day, Cultural Day, Graduation, and other academic milestones.
                </p>
              </div>

              {/* Action Trigger */}
              <button 
                onClick={() => setIsCreateBudgetOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-all inline-flex items-center gap-2 shadow-sm self-start md:self-auto cursor-pointer"
              >
                <Lucide.Plus className="w-4 h-4" />
                <span>Allocate Event Budget</span>
              </button>
            </div>

            {/* Overall Financial Metrics Grid */}
            {(() => {
              const bArray = data?.eventBudgets || [];
              const aggregateBudget = bArray.reduce((acc, b) => acc + (b.totalBudget || 0), 0);
              const aggregateSpent = bArray.reduce((acc, b) => acc + (b.totalSpent || 0), 0);
              const aggregateRemaining = aggregateBudget - aggregateSpent;
              const overallBurnRate = aggregateBudget > 0 ? Math.round((aggregateSpent / aggregateBudget) * 100) : 0;
              
              const filteredBudgets = bArray.filter(b => {
                const matchesSearch = b.eventName.toLowerCase().includes(budgetSearchQuery.toLowerCase());
                const matchesFilter = budgetStatusFilter === "all" || b.status === budgetStatusFilter;
                return matchesSearch && matchesFilter;
              });

              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Budget Pool</span>
                      <div className="text-2xl font-black text-slate-900">₦{aggregateBudget.toLocaleString()}</div>
                      <p className="text-[10px] text-slate-405 font-semibold">Allocated across all key milestones</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Disbursed Expenses</span>
                      <div className="text-2xl font-black text-indigo-600">₦{aggregateSpent.toLocaleString()}</div>
                      <div className="flex items-center gap-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${overallBurnRate > 90 ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                          {overallBurnRate}% Burn Rate
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Remaining Balance</span>
                      <div className={`text-2xl font-black ${aggregateRemaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {aggregateRemaining < 0 ? `-₦${Math.abs(aggregateRemaining).toLocaleString()}` : `₦${aggregateRemaining.toLocaleString()}`}
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold">Available school treasury reserves</p>
                    </div>

                    {/* Graphical mini gauge */}
                    <div className="flex flex-col justify-center space-y-1">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Budget Exhaustion Meter</span>
                      <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden p-0.5 relative">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${overallBurnRate > 100 ? 'bg-rose-500' : overallBurnRate > 85 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, overallBurnRate)}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-400 font-semibold text-right">Burn: {overallBurnRate}%</span>
                    </div>
                  </div>

                  {/* Filter controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-100">
                    <div className="relative w-full sm:max-w-xs">
                      <Lucide.Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input 
                        type="text"
                        placeholder="Search event budget details..."
                        value={budgetSearchQuery}
                        onChange={(e) => setBudgetSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs pl-9 pr-3 py-2 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto self-stretch sm:self-auto justify-end">
                      <span className="text-xs font-bold text-slate-400 shrink-0">Filter Status:</span>
                      <select 
                        value={budgetStatusFilter}
                        onChange={(e) => setBudgetStatusFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 px-3 py-2 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        <option value="all">All Budgets</option>
                        <option value="under_budget">Under Budget</option>
                        <option value="over_budget">Over Budget</option>
                        <option value="on_budget">On Budget</option>
                      </select>
                    </div>
                  </div>

                  {/* Budgets Grid */}
                  {filteredBudgets.length === 0 ? (
                    <div className="bg-slate-50 border border-dashed border-slate-200 p-8 text-center rounded-2xl text-xs text-slate-400 space-y-2">
                      <Lucide.Wallet className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-bold text-slate-500">No event budgets correspond to filters</p>
                      <p className="text-[11px]">Initiate an allocation using the "Allocate Event Budget" button above.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {filteredBudgets.map((budget) => {
                        const percentSpent = budget.totalBudget > 0 ? Math.round((budget.totalSpent / budget.totalBudget) * 100) : 0;
                        
                        return (
                          <div 
                            key={budget.id}
                            className={`p-5 rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between ${
                              budget.status === 'over_budget' 
                                ? 'bg-rose-50/20 border-rose-200 hover:border-rose-300' 
                                : 'bg-white border-slate-200 hover:border-indigo-200'
                            }`}
                          >
                            {/* Budget Title and Badge */}
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-extrabold text-slate-800 tracking-tight leading-tight">
                                  {budget.eventName}
                                </h4>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                                  budget.status === 'over_budget'
                                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                                    : budget.status === 'on_budget'
                                      ? 'bg-slate-100 text-slate-700 border-slate-200'
                                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                }`}>
                                  {budget.status.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-medium">
                                Associated Event ID: <span className="font-mono text-[10px] font-bold text-slate-500">{budget.eventId || 'General'}</span>
                              </p>
                            </div>

                            {/* Spend Progress Thermometer */}
                            <div className="my-4 space-y-1.5">
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                <span>Budget Spent: {percentSpent}%</span>
                                <span className={`${budget.status === 'over_budget' ? 'text-rose-600' : 'text-slate-700'}`}>
                                  ₦{budget.totalSpent.toLocaleString()} / ₦{budget.totalBudget.toLocaleString()}
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-100">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    percentSpent > 100 
                                      ? 'bg-rose-500' 
                                      : percentSpent > 85 
                                        ? 'bg-amber-400' 
                                        : 'bg-gradient-to-r from-indigo-500 to-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(100, percentSpent)}%` }}
                                />
                              </div>
                            </div>

                            {/* Key Indicators Panel */}
                            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] mb-4">
                              <div>
                                <span className="text-slate-400 block text-[9px] font-bold uppercase">Items Count</span>
                                <span className="font-bold text-slate-800">{(budget.items || []).length} lines</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px] font-bold uppercase">Remaining Balance</span>
                                <span className={`font-bold ${budget.remaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  {budget.remaining < 0 ? `-₦${Math.abs(budget.remaining).toLocaleString()}` : `₦${budget.remaining.toLocaleString()}`}
                                </span>
                              </div>
                            </div>

                            {/* Action Triggers */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                              <button 
                                onClick={() => {
                                  setSelectedBudget(budget);
                                  setIsReportModalOpen(true);
                                }}
                                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] py-2 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer animate-none"
                              >
                                <Lucide.FileText className="w-3.5 h-3.5 text-indigo-500" />
                                <span>View Report</span>
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedBudget(budget);
                                  setEditingBudgetLimit(String(budget.totalBudget));
                                  setIsManageBudgetOpen(true);
                                }}
                                className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 font-bold text-[11px] py-2 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer animate-none"
                              >
                                <Lucide.Settings className="w-3.5 h-3.5" />
                                <span>Manage Items</span>
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* =========================================================
              THE TRIAGE COLUMNS (CURRENT, UPCOMING, OVERDUE)
              ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMN 1: CURRENTLY HAPPENING */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-emerald-200">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-extrabold text-sm text-emerald-800 uppercase tracking-widest">
                  Currently Happening
                </h3>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-bold">
                  {data.currentlyHappening.currentEvents.length + data.currentlyHappening.currentCampaigns.length + data.currentlyHappening.currentDeadlines.length}
                </span>
              </div>

              {/* Current Events List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Active Events</h4>
                {data.currentlyHappening.currentEvents.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 p-4 text-center rounded-xl text-xs text-slate-400">
                    No active events today
                  </div>
                ) : (
                  data.currentlyHappening.currentEvents.map((evt) => (
                    <div 
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className="bg-white hover:bg-slate-50 border-l-4 border-emerald-500 border-y border-r border-slate-200/80 p-4 rounded-r-xl shadow-2xs transition-all hover:-translate-y-0.5 cursor-pointer"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {evt.category?.name || "General Event"}
                        </span>
                        <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border border-emerald-100">
                          Active Today
                        </span>
                      </div>
                      <h5 className="font-bold text-sm text-slate-900 mt-1">{evt.title}</h5>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{evt.description}</p>
                      
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                        <span className="font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {evt.startDate} to {evt.endDate}
                        </span>
                        <span className="font-bold text-indigo-600 flex items-center gap-0.5 hover:underline">
                          Inspect <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Current Campaigns List */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Active Fee Drives</h4>
                {data.currentlyHappening.currentCampaigns.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 p-4 text-center rounded-xl text-xs text-slate-400">
                    No active fee drives today
                  </div>
                ) : (
                  data.currentlyHappening.currentCampaigns.map((camp) => (
                    <div 
                      key={camp.id}
                      onClick={() => setSelectedCampaign(camp)}
                      className="bg-white hover:bg-slate-50 border-l-4 border-teal-500 border-y border-r border-slate-200/80 p-4 rounded-r-xl shadow-2xs transition-all hover:-translate-y-0.5 cursor-pointer"
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {camp.week} Drive
                      </span>
                      <h5 className="font-bold text-sm text-slate-900 mt-1">{camp.name}</h5>
                      
                      <div className="mt-3 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Collection Target:</span>
                          <span className="font-bold text-slate-800">₦{camp.targetCollection.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-teal-500 h-full rounded-full"
                            style={{ width: `${(camp.actualCollection / camp.targetCollection) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>Collected: ₦{(camp.actualCollection || 0).toLocaleString()}</span>
                          <span className="font-bold text-teal-600">
                            {Math.round((camp.actualCollection / camp.targetCollection) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Current Deadlines List */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Current Deadlines (This Week)</h4>
                {data.currentlyHappening.currentDeadlines.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 p-4 text-center rounded-xl text-xs text-slate-400">
                    No immediate task deadlines this week
                  </div>
                ) : (
                  data.currentlyHappening.currentDeadlines.map((tsk) => (
                    <div 
                      key={tsk.id}
                      onClick={() => setSelectedTask(tsk)}
                      className="bg-white hover:bg-slate-50 border border-slate-200 p-3.5 rounded-xl shadow-2xs transition-all hover:-translate-y-0.5 cursor-pointer flex items-start gap-3"
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${tsk.status === 'In Progress' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="bg-slate-100 text-slate-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                            {tsk.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">Due {tsk.dueDate}</span>
                        </div>
                        <h5 className="font-bold text-xs text-slate-800 mt-1 truncate">{tsk.title}</h5>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{tsk.description}</p>
                        <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
                          <User className="w-3 h-3 text-slate-300" />
                          <span>Assignee: {tsk.assignedUser}</span>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

            {/* COLUMN 2: UPCOMING */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-indigo-200">
                <span className="w-3 h-3 rounded-full bg-indigo-500" />
                <h3 className="font-extrabold text-sm text-indigo-800 uppercase tracking-widest">
                  Upcoming Operations
                </h3>
                <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full font-bold">
                  {data.upcoming.upcomingEvents.length + data.upcoming.upcomingExams.length + data.upcoming.upcomingFeeDrives.length}
                </span>
              </div>

              {/* Upcoming Events List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Upcoming Events</h4>
                {data.upcoming.upcomingEvents.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 p-4 text-center rounded-xl text-xs text-slate-400">
                    No upcoming events listed
                  </div>
                ) : (
                  data.upcoming.upcomingEvents.slice(0, 3).map((evt) => (
                    <div 
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className="bg-white hover:bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-2xs transition-all hover:-translate-y-0.5 cursor-pointer flex gap-3 items-start"
                    >
                      {/* Date block layout */}
                      <div className="bg-indigo-50 text-indigo-700 p-2 rounded-xl text-center shrink-0 w-12 border border-indigo-100">
                        <span className="text-xs font-black block leading-none">
                          {new Date(evt.startDate).toLocaleString('default', { day: 'numeric' })}
                        </span>
                        <span className="text-[9px] font-bold uppercase block mt-1">
                          {new Date(evt.startDate).toLocaleString('default', { month: 'short' })}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase border border-indigo-100">
                          {evt.category?.name || "Event"}
                        </span>
                        <h5 className="font-bold text-xs text-slate-800 mt-1.5 truncate">{evt.title}</h5>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{evt.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Upcoming Exams List */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Upcoming Exams</h4>
                {data.upcoming.upcomingExams.length === 0 ? (
                  <div className="bg-indigo-50/20 border border-dashed border-indigo-150 p-4 text-center rounded-xl text-xs text-indigo-700">
                    <BookOpen className="w-5 h-5 mx-auto text-indigo-400 mb-1.5" />
                    <span>All exams completed or none scheduled</span>
                  </div>
                ) : (
                  data.upcoming.upcomingExams.map((exm) => (
                    <div 
                      key={exm.id}
                      className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-2xs flex items-center justify-between gap-2"
                    >
                      <div>
                        <span className="bg-slate-100 text-slate-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                          {exm.grade} • {exm.subject}
                        </span>
                        <h5 className="font-bold text-xs text-slate-800 mt-1">{exm.title}</h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">Date: {exm.date}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2 py-1 rounded-lg border border-indigo-100 block">
                          Weight: {exm.weightPercentage}%
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium block mt-1">{exm.totalMarks} Marks Max</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Upcoming Fee Drives */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Planned Fee Reminders</h4>
                {data.upcoming.upcomingFeeDrives.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 p-4 text-center rounded-xl text-xs text-slate-400">
                    No future drives mapped
                  </div>
                ) : (
                  data.upcoming.upcomingFeeDrives.map((camp) => (
                    <div 
                      key={camp.id}
                      onClick={() => setSelectedCampaign(camp)}
                      className="bg-white hover:bg-slate-50 border border-slate-200 p-3.5 rounded-xl shadow-2xs transition-all hover:-translate-y-0.5 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {camp.week} Focus
                        </span>
                        <h5 className="font-bold text-xs text-slate-800 mt-0.5">{camp.name}</h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">Launches: {camp.startDate}</p>
                      </div>
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg">
                        ₦{camp.targetCollection.toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>

            </div>

            {/* COLUMN 3: OVERDUE */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-rose-200">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <h3 className="font-extrabold text-sm text-rose-800 uppercase tracking-widest">
                  Overdue / Escalations
                </h3>
                <span className="bg-rose-100 text-rose-800 text-xs px-2 py-0.5 rounded-full font-bold">
                  {data.overdue.overdueTasks.length + data.overdue.missedDeadlines.length}
                </span>
              </div>

              {/* Overdue Tasks List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Overdue Action items</h4>
                {data.overdue.overdueTasks.length === 0 ? (
                  <div className="bg-emerald-50 border border-emerald-150 p-4 text-center rounded-xl text-xs text-emerald-800">
                    <CheckCircle className="w-5 h-5 mx-auto text-emerald-500 mb-1.5" />
                    <span>Excellent! No overdue administrative tasks</span>
                  </div>
                ) : (
                  data.overdue.overdueTasks.map((tsk) => (
                    <div 
                      key={tsk.id}
                      onClick={() => setSelectedTask(tsk)}
                      className="bg-white hover:bg-slate-50 border-l-4 border-rose-500 border-y border-r border-slate-200 p-3.5 rounded-r-xl shadow-2xs transition-all hover:-translate-y-0.5 cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <span className="bg-rose-50 text-rose-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase border border-rose-100">
                          Overdue
                        </span>
                        <span className="text-[10px] text-rose-600 font-extrabold">Due {tsk.dueDate}</span>
                      </div>
                      <h5 className="font-bold text-xs text-slate-800 mt-1.5 truncate">{tsk.title}</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{tsk.description}</p>
                      
                      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                        <span className="font-medium flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-300" />
                          <span>Owner: {tsk.assignedUser}</span>
                        </span>
                        <span className="text-rose-600 font-bold uppercase tracking-wider text-[9px]">
                          🚨 Escalated
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Missed Deadlines Warning Frame */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 font-mono">Missed Milestone Reminders</h4>
                {data.overdue.missedDeadlines.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 p-4 text-center rounded-xl text-xs text-slate-400">
                    All compliance milestones in check
                  </div>
                ) : (
                  <div className="bg-rose-50/50 border border-rose-150 p-4 rounded-xl text-rose-900 space-y-3">
                    <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wide flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Pending Management Inquest Required</span>
                    </p>
                    <p className="text-xs text-rose-700/90 leading-relaxed">
                      The following high-priority syllabus exam draft items are pending dispatch and are holding up class consolidation workflows:
                    </p>
                    <div className="space-y-2">
                      {data.overdue.missedDeadlines.slice(0, 2).map((dl) => (
                        <div key={dl.id} className="bg-white/80 p-2.5 rounded-lg border border-rose-100 text-xs flex justify-between items-center">
                          <span className="font-bold text-slate-800 truncate pr-2">{dl.title}</span>
                          <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold shrink-0">
                            {dl.assignedUser}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* =========================================================
              INTERACTIVE REACTIONAL CHARTS SECTION (SVG)
              ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* CHART 1: FEE COLLECTION TARGET VS COLLECTED */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-slate-900">Termly Fee Drives Collection</h4>
                  <p className="text-xs text-slate-500">Weekly Target vs Actual Collected collections (Term 3)</p>
                </div>
                <div className="bg-slate-50 px-3 py-1.5 rounded-lg text-slate-500 text-xs font-bold flex items-center gap-1 border border-slate-100">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Collected: ₦{(data.stats.totalCampaignActual).toLocaleString()}</span>
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div className="relative h-64 w-full flex items-end pt-6">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] text-slate-400 font-mono">
                  {[100, 75, 50, 25, 0].map((percent) => (
                    <div key={percent} className="w-full flex items-center gap-2">
                      <span className="w-8 text-right">{percent === 100 ? '₦50K' : percent === 75 ? '₦37K' : percent === 50 ? '₦25K' : percent === 25 ? '₦12K' : '₦0'}</span>
                      <div className="flex-1 border-t border-slate-100" />
                    </div>
                  ))}
                </div>

                {/* Bars Grid */}
                <div className="relative z-10 w-full h-full flex items-end justify-around pl-10">
                  {data.stats.feeCampaignChartData.map((drive, idx) => {
                    // Normalize bar height based on 50,000 max
                    const maxVal = 50000;
                    const targetHeight = Math.min(100, (drive.Target / maxVal) * 100);
                    const collectedHeight = Math.min(100, (drive.Collected / maxVal) * 100);

                    return (
                      <div 
                        key={idx} 
                        className="flex flex-col items-center group relative cursor-pointer"
                        onMouseEnter={() => setHoveredFeeIndex(idx)}
                        onMouseLeave={() => setHoveredFeeIndex(null)}
                      >
                        {/* Interactive Tooltip popup on hover */}
                        <AnimatePresence>
                          {hoveredFeeIndex === idx && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: -5, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute -top-16 bg-slate-900 text-white text-[10px] p-2.5 rounded-xl shadow-xl z-30 w-36 text-center pointer-events-none"
                            >
                              <p className="font-bold">{drive.name}</p>
                              <div className="flex justify-between mt-1 text-slate-300">
                                <span>Target:</span>
                                <span>₦{drive.Target.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-emerald-400">
                                <span>Collected:</span>
                                <span>₦{drive.Collected.toLocaleString()}</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Clustered Bars Container */}
                        <div className="flex items-end gap-1.5 h-44">
                          {/* Target bar */}
                          <div 
                            className="w-4 bg-slate-200 group-hover:bg-slate-300 rounded-t transition-all duration-300 relative"
                            style={{ height: `${targetHeight}%` }}
                          />
                          {/* Collected bar */}
                          <div 
                            className="w-4 bg-indigo-500 group-hover:bg-indigo-600 rounded-t transition-all duration-300 relative"
                            style={{ height: `${collectedHeight}%` }}
                          />
                        </div>

                        {/* Axis Labels */}
                        <span className="text-[10px] font-bold text-slate-500 mt-2 truncate max-w-16">
                          {drive.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend Indicator */}
              <div className="flex justify-center items-center space-x-6 text-xs pt-2">
                <div className="flex items-center space-x-2">
                  <span className="w-3.5 h-3.5 rounded bg-slate-200" />
                  <span className="text-slate-600 font-medium">Target Collection (₦)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3.5 h-3.5 rounded bg-indigo-500" />
                  <span className="text-slate-600 font-medium">Actual Collected (₦)</span>
                </div>
              </div>
            </div>

            {/* CHART 2: ADMINISTRATIVE TASK COMPLETION STATUS */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-slate-900">Task Completion Status</h4>
                  <p className="text-xs text-slate-500">Continuous execution of administrative operations</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-bold">
                  {data.stats.completedTasksCount} / {data.stats.totalTasksCount} Handled
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
                
                {/* Visual Donut Ring Render */}
                <div className="relative flex justify-center items-center h-44">
                  {/* SVG Circle Graph */}
                  <svg className="w-36 h-36 transform -rotate-90">
                    <circle 
                      cx="72" 
                      cy="72" 
                      r="50" 
                      className="stroke-slate-100 fill-none" 
                      strokeWidth="12" 
                    />
                    {/* Segment completed */}
                    {(() => {
                      const pct = Math.round((data.stats.completedTasksCount / (data.stats.totalTasksCount || 1)) * 100);
                      const circumference = 2 * Math.PI * 50;
                      const offset = circumference - (pct / 100) * circumference;
                      return (
                        <circle 
                          cx="72" 
                          cy="72" 
                          r="50" 
                          className="stroke-emerald-500 fill-none transition-all duration-1000" 
                          strokeWidth="12" 
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                        />
                      );
                    })()}
                  </svg>
                  
                  {/* Absolute core summary */}
                  <div className="absolute text-center">
                    <p className="text-3xl font-black text-slate-800 leading-none">
                      {Math.round((data.stats.completedTasksCount / (data.stats.totalTasksCount || 1)) * 100)}%
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Efficiency</p>
                  </div>
                </div>

                {/* Status breakdown grid */}
                <div className="space-y-4">
                  {data.stats.taskChartData.map((seg, idx) => {
                    const pct = Math.round((seg.value / (data.stats.totalTasksCount || 1)) * 100);
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                            <span 
                              className="w-2.5 h-2.5 rounded-full" 
                              style={{ backgroundColor: seg.color }}
                            />
                            <span>{seg.name}</span>
                          </span>
                          <span className="text-slate-500 font-semibold">{seg.value} Tasks ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full"
                            style={{ backgroundColor: seg.color, width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

          </div>

          {/* =========================================================
              📦 INVENTORY & READINESS CONTROL CENTER
              ========================================================= */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border border-indigo-100">
                  📦 Logistics & Operations
                </span>
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Inventory Readiness Monitoring
                </h3>
                <p className="text-xs text-slate-500">
                  Audit and verify material stock thresholds prior to scheduled events, track requirements, and manage shortage alerts.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => {
                    setNewInvName("");
                    setNewInvQuantity(100);
                    setNewInvUnit("units");
                    setIsCreateInventoryOpen(true);
                  }}
                  className="bg-slate-900 hover:bg-slate-950 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Lucide.Plus className="w-3.5 h-3.5" />
                  <span>Add Stock Item</span>
                </button>

                <button
                  onClick={() => {
                    setNewRcEventId("");
                    setNewRcEventName("");
                    setNewRcActivityDate("2026-07-12");
                    setNewRcNotes("");
                    setNewRcChecklistItems([]);
                    setIsCreateReadinessOpen(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Lucide.CalendarDays className="w-3.5 h-3.5" />
                  <span>Register Activity Checklist</span>
                </button>
              </div>
            </div>

            {/* Bento Statistics Counters Grid */}
            {(() => {
              const items = data?.inventory || [];
              const checks = data?.inventoryReadiness || [];
              
              const totalItemsCount = items.length;
              const criticalShortagesCount = items.filter(it => it.stockQuantity <= 10).length;
              const activeChecklistsCount = checks.length;
              
              // Count how many checklists have at least one shortage
              const pendingChecksCount = checks.filter(c => c.status === "warning" || c.status === "critical").length;
              const readyChecksCount = activeChecklistsCount - pendingChecksCount;
              const readinessPercentage = activeChecklistsCount > 0 ? Math.round((readyChecksCount / activeChecklistsCount) * 100) : 100;

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Card 1: Total Ledger */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-150 flex flex-col justify-between space-y-3">
                    <div className="flex justify-between items-start">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Managed Materials</p>
                      <span className="bg-slate-100 p-1.5 rounded-lg text-slate-500">
                        <Lucide.Layers className="w-4 h-4" />
                      </span>
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-slate-800 leading-tight">{totalItemsCount}</h4>
                      <p className="text-[10px] text-slate-500 font-medium mt-1">Unique catalog resources</p>
                    </div>
                  </div>

                  {/* Card 2: Active checklists */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-150 flex flex-col justify-between space-y-3">
                    <div className="flex justify-between items-start">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scheduled Checklists</p>
                      <span className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600">
                        <Lucide.CheckCircle className="w-4 h-4" />
                      </span>
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-slate-800 leading-tight">{activeChecklistsCount}</h4>
                      <p className="text-[10px] text-slate-500 font-medium mt-1">
                        {readyChecksCount} fully ready • {pendingChecksCount} warning state
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Critical Shortages */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-150 flex flex-col justify-between space-y-3">
                    <div className="flex justify-between items-start">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Stock Risks</p>
                      <span className={`p-1.5 rounded-lg ${criticalShortagesCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                        <Lucide.AlertTriangle className="w-4 h-4" />
                      </span>
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-slate-800 leading-tight">{criticalShortagesCount}</h4>
                      <p className="text-[10px] text-slate-500 font-medium mt-1">Items at or below 10 units</p>
                    </div>
                  </div>

                  {/* Card 4: Overall Operations Readiness Ratio */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-150 flex flex-col justify-between space-y-3">
                    <div className="flex justify-between items-start">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Operational Readiness</p>
                      <span className="bg-emerald-50 p-1.5 rounded-lg text-emerald-600">
                        <Lucide.TrendingUp className="w-4 h-4" />
                      </span>
                    </div>
                    <div>
                      <div className="flex items-baseline space-x-2">
                        <h4 className="text-2xl font-black text-slate-800 leading-tight">{readinessPercentage}%</h4>
                        <span className="text-[10px] font-bold text-emerald-600">Target 100%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${readinessPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                </div>
              );
            })()}

            {/* Sub-Tabs Section */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-1 flex-wrap gap-2">
              <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveInventoryTab('readiness')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeInventoryTab === 'readiness' 
                      ? 'bg-white text-slate-800 shadow-2xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  📋 Activity Checklists ({ (data?.inventoryReadiness || []).length })
                </button>
                <button
                  onClick={() => setActiveInventoryTab('items')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeInventoryTab === 'items' 
                      ? 'bg-white text-slate-800 shadow-2xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  📦 Material Ledger ({ (data?.inventory || []).length })
                </button>
                <button
                  onClick={() => setActiveInventoryTab('alerts')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
                    activeInventoryTab === 'alerts' 
                      ? 'bg-white text-slate-800 shadow-2xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ⚠️ Shortage Alerts
                  {(() => {
                    const lowItems = (data?.inventory || []).filter(it => {
                      // Find if any checklist has shortage for this item
                      return (data?.inventoryReadiness || []).some(rc => 
                        rc.items.some(rcIt => rcIt.itemId === it.id && rcIt.availableQuantity < rcIt.requiredQuantity)
                      );
                    });
                    if (lowItems.length > 0) {
                      return (
                        <span className="absolute -top-1 -right-1.5 bg-rose-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                          {lowItems.length}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </button>
              </div>

              {/* Dynamic Context Filters for Material Ledger */}
              {activeInventoryTab === 'items' && (
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-48">
                    <Lucide.Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Filter materials..."
                      value={inventorySearchQuery}
                      onChange={(e) => setInventorySearchQuery(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-3 py-1.5 outline-none focus:border-indigo-500 w-full"
                    />
                  </div>
                  <select
                    value={inventoryCategoryFilter}
                    onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none focus:border-indigo-500 cursor-pointer font-bold text-slate-600"
                  >
                    <option value="all">All Categories</option>
                    <option value="Academic">Academic</option>
                    <option value="Sports">Sports</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Administrative">Administrative</option>
                    <option value="General">General</option>
                  </select>
                </div>
              )}
            </div>

            {/* TAB CONTENT 1: ACTIVITY READINESS CHECKLISTS */}
            {activeInventoryTab === 'readiness' && (
              <div className="space-y-4">
                {(data?.inventoryReadiness || []).length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 py-8 px-4 text-center rounded-2xl">
                    <p className="text-xs font-bold text-slate-400">No active operational readiness checklists scheduled</p>
                    <p className="text-[11px] text-slate-500 mt-1">Register checklists for sports events, exam setups, or graduations.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(data?.inventoryReadiness || []).map((check) => {
                      const totalRequirements = check.items.length;
                      const readyCount = check.items.filter(it => it.availableQuantity >= it.requiredQuantity).length;
                      const percentReady = totalRequirements > 0 ? Math.round((readyCount / totalRequirements) * 100) : 100;

                      return (
                        <div 
                          key={check.id}
                          className={`bg-white rounded-2xl p-5 border transition-all ${
                            check.status === 'warning' || check.status === 'critical' 
                              ? 'border-amber-200/80 shadow-3xs bg-amber-50/5' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${check.status === 'ready' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                                {check.eventName}
                              </h4>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                                <span>Date: {check.activityDate}</span>
                                <span>•</span>
                                <span>ID: {check.id}</span>
                              </div>
                            </div>

                            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                              check.status === 'ready' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : 'bg-amber-50 text-amber-700 border border-amber-150 animate-pulse'
                            }`}>
                              {check.status === 'ready' ? 'FULLY READY' : 'SHORTAGE DETECTED'}
                            </span>
                          </div>

                          {/* Progress slider showing complete threshold */}
                          <div className="mt-4 space-y-1">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-slate-400 uppercase tracking-wider">Audit Progress</span>
                              <span className="text-slate-700">{readyCount} / {totalRequirements} Items Available ({percentReady}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${percentReady === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${percentReady}%` }}
                              />
                            </div>
                          </div>

                          {/* Interactive Checklist list inside card */}
                          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                            {check.items.map((it, i) => {
                              const deficit = it.requiredQuantity - it.availableQuantity;
                              const isShort = deficit > 0;

                              return (
                                <div key={i} className="flex items-center justify-between p-2 bg-slate-50/50 rounded-lg border border-slate-100 text-xs">
                                  <div className="flex items-center space-x-2">
                                    <span className={`w-1.5 h-1.5 rounded-full ${isShort ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                    <span className="font-bold text-slate-700">{it.name}</span>
                                  </div>

                                  <div className="flex items-center space-x-3">
                                    <span className="font-medium text-slate-500">
                                      {it.availableQuantity} / {it.requiredQuantity}
                                    </span>
                                    {isShort ? (
                                      <div className="flex items-center space-x-1.5">
                                        <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-bold">
                                          Shortage: -{deficit}
                                        </span>
                                        {it.itemId && (
                                          <button
                                            onClick={() => handleUpdateStockQuantity(it.itemId, it.requiredQuantity)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer"
                                            title="Quickly fill stock to required level"
                                          >
                                            Refill
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                                        Ready
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {check.notes && (
                            <p className="mt-3.5 text-[11px] text-slate-500 bg-slate-50/50 rounded-xl p-2.5 border border-slate-100/80 italic">
                              <span className="font-bold not-italic text-slate-400 block mb-0.5 text-[9px] uppercase tracking-wider">Verification Notes</span>
                              "{check.notes}"
                            </p>
                          )}

                          {/* Control actions */}
                          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                            <button
                              onClick={() => {
                                setSelectedReadinessCheck(check);
                                setEditRcNotes(check.notes || "");
                                setIsManageReadinessOpen(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-700 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Lucide.Settings className="w-3.5 h-3.5" />
                              <span>Manage Checklist</span>
                            </button>

                            <button
                              onClick={() => handleDeleteReadinessCheck(check.id)}
                              className="text-slate-400 hover:text-rose-600 font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Lucide.Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: MATERIAL CATALOG LEDGER */}
            {activeInventoryTab === 'items' && (
              <div className="space-y-4">
                {(() => {
                  const items = data?.inventory || [];
                  const filtered = items.filter(it => {
                    const matchesSearch = it.name.toLowerCase().includes(inventorySearchQuery.toLowerCase()) || 
                                          it.category.toLowerCase().includes(inventorySearchQuery.toLowerCase());
                    const matchesCategory = inventoryCategoryFilter === "all" || it.category === inventoryCategoryFilter;
                    return matchesSearch && matchesCategory;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-slate-50 border border-dashed border-slate-200 py-8 px-4 text-center rounded-2xl">
                        <p className="text-xs font-bold text-slate-400">No materials catalog items match your search filters</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filtered.map((item) => (
                        <div 
                          key={item.id}
                          className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-300 transition-all shadow-3xs hover:-translate-y-0.5"
                        >
                          <div className="flex justify-between items-start">
                            <span className="bg-slate-50 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded border border-slate-150 uppercase tracking-widest">
                              {item.category}
                            </span>
                            
                            <button
                              onClick={() => handleDeleteInventoryItem(item.id)}
                              className="text-slate-300 hover:text-rose-500 p-0.5 transition-colors cursor-pointer"
                              title="Delete catalog item"
                            >
                              <Lucide.Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <h4 className="font-bold text-xs text-slate-800 mt-3">{item.name}</h4>
                          <p className="text-[10px] text-slate-400 font-medium font-mono">ID: {item.id}</p>

                          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-150/50 flex items-center justify-between">
                            <div>
                              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Current Stock</p>
                              <p className="text-lg font-black text-slate-800 mt-0.5">
                                {item.stockQuantity} <span className="text-xs text-slate-400 font-normal">{item.unit}</span>
                              </p>
                            </div>

                            {/* Stock delivery adjustment controls */}
                            <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200">
                              <button
                                onClick={() => handleUpdateStockQuantity(item.id, Math.max(0, item.stockQuantity - 10))}
                                className="px-1.5 py-0.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700 text-[10px] font-bold cursor-pointer"
                                title="Subtract 10"
                              >
                                -10
                              </button>
                              <span className="text-[10px] text-slate-300 font-bold">|</span>
                              <button
                                onClick={() => handleUpdateStockQuantity(item.id, item.stockQuantity + 50)}
                                className="px-1.5 py-0.5 hover:bg-slate-100 rounded text-indigo-600 hover:text-indigo-800 text-[10px] font-bold cursor-pointer"
                                title="Add 50"
                              >
                                +50
                              </button>
                            </div>
                          </div>

                          {/* Quick manual text input for accurate audits */}
                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Set Stock:</span>
                            <input
                              type="number"
                              value={item.stockQuantity}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                handleUpdateStockQuantity(item.id, isNaN(val) ? 0 : val);
                              }}
                              className="bg-slate-50 border border-slate-200 rounded-lg text-center text-xs w-16 py-1 outline-none focus:border-indigo-500 font-bold text-slate-800"
                            />
                          </div>

                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB CONTENT 3: RISK ALERTS LOG */}
            {activeInventoryTab === 'alerts' && (
              <div className="space-y-4">
                {(() => {
                  const checklistShortages: Array<{
                    id: string;
                    eventName: string;
                    activityDate: string;
                    itemName: string;
                    itemId: string;
                    required: number;
                    available: number;
                    deficit: number;
                  }> = [];

                  (data?.inventoryReadiness || []).forEach(rc => {
                    rc.items.forEach(it => {
                      if (it.availableQuantity < it.requiredQuantity) {
                        checklistShortages.push({
                          id: rc.id,
                          eventName: rc.eventName,
                          activityDate: rc.activityDate,
                          itemName: it.name,
                          itemId: it.itemId,
                          required: it.requiredQuantity,
                          available: it.availableQuantity,
                          deficit: it.requiredQuantity - it.availableQuantity
                        });
                      }
                    });
                  });

                  if (checklistShortages.length === 0) {
                    return (
                      <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center space-y-2 max-w-lg mx-auto">
                        <span className="bg-emerald-100 p-2 rounded-full inline-block text-emerald-600">
                          <Lucide.CheckCircle className="w-5 h-5" />
                        </span>
                        <h4 className="font-extrabold text-slate-800 text-sm">No Operational Logistics Risks Detected</h4>
                        <p className="text-xs text-emerald-700/80 leading-relaxed">
                          All registered upcoming checklists are 100% covered by current warehouse stock quantities. All systems are green.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
                        <Lucide.AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="font-bold text-xs text-amber-800 uppercase tracking-wider">Automated Risk Assessment Analysis</h4>
                          <p className="text-xs text-amber-700/90 leading-relaxed">
                            Logistics intelligence has detected {checklistShortages.length} specific deficit bottlenecks. Click "Expedite Procurement" on any deficit below to authorize immediate delivery and auto-refill stock levels.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {checklistShortages.map((alert, idx) => (
                          <div 
                            key={idx}
                            className="bg-white border border-rose-150 rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-3xs relative overflow-hidden bg-rose-50/5"
                          >
                            <div className="absolute top-0 left-0 bottom-0 w-1 bg-rose-500" />
                            
                            <div className="space-y-1">
                              <span className="bg-rose-50 text-rose-700 text-[9px] font-black px-2 py-0.5 rounded border border-rose-100 uppercase tracking-widest inline-block">
                                Deficit Bottleneck
                              </span>
                              <h4 className="font-extrabold text-sm text-slate-800 mt-2">
                                Shortage: {alert.itemName}
                              </h4>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                Required for <span className="font-bold text-slate-700">{alert.eventName}</span> on <span className="font-bold text-slate-700">{alert.activityDate}</span>.
                              </p>
                              
                              <div className="flex gap-4 pt-2">
                                <div>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">Required</p>
                                  <p className="text-sm font-bold text-slate-700">{alert.required} units</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">Available</p>
                                  <p className="text-sm font-bold text-slate-700 text-rose-600">{alert.available} units</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase font-bold text-rose-500">Deficit</p>
                                  <p className="text-sm font-black text-rose-600">-{alert.deficit} units</p>
                                </div>
                              </div>
                            </div>

                            {alert.itemId && (
                              <button
                                onClick={() => handleUpdateStockQuantity(alert.itemId, alert.required)}
                                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer text-center inline-flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <Lucide.ArrowUpRight className="w-3.5 h-3.5" />
                                <span>Expedite Procurement & Refill</span>
                              </button>
                            )}

                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

          </div>

          {/* =========================================================
              MODAL POPUP 1: EVENT COMPREHENSIVE CARD
              ========================================================= */}
          <AnimatePresence>
            {selectedEvent && (
              <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl relative"
                >
                  <button 
                    onClick={() => setSelectedEvent(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                  >
                    <DynamicLucideIcon name="X" className="w-5 h-5" />
                  </button>

                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-widest inline-block">
                    {selectedEvent.category?.name || "Calendar Event"}
                  </span>
                  
                  <h3 className="text-lg font-bold text-slate-900 mt-4">{selectedEvent.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <CalendarDays className="w-4 h-4 text-slate-400" />
                    <span>Duration: {selectedEvent.startDate} to {selectedEvent.endDate}</span>
                  </p>

                  <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operational Description</p>
                    <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">{selectedEvent.description}</p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Target Campus</p>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {selectedEvent.branchId === "All" ? "All Divisions" : selectedEvent.branchId === "GN" ? "Gawun Nama" : "Rayfield West"}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Academic Session</p>
                      <p className="font-bold text-slate-800 mt-0.5">2025/2026 Term 3</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedEvent(null)}
                    className="mt-6 w-full bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs py-3 rounded-2xl transition-colors cursor-pointer text-center"
                  >
                    Acknowledge & Close
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* =========================================================
              MODAL POPUP 2: CAMPAIGN DETAILS OVERLAY
              ========================================================= */}
          <AnimatePresence>
            {selectedCampaign && (
              <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl relative"
                >
                  <button 
                    onClick={() => setSelectedCampaign(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                  >
                    <DynamicLucideIcon name="X" className="w-5 h-5" />
                  </button>

                  <span className="bg-teal-50 text-teal-700 text-[10px] font-extrabold px-3 py-1 rounded-full border border-teal-100 uppercase tracking-widest inline-block">
                    {selectedCampaign.week} collection
                  </span>
                  
                  <h3 className="text-lg font-bold text-slate-900 mt-4">{selectedCampaign.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Reminders active: {selectedCampaign.startDate} to {selectedCampaign.endDate}</span>
                  </p>

                  <div className="mt-5 space-y-4">
                    <div className="p-4 bg-teal-50/40 rounded-2xl border border-teal-100/50">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Campaign Collection Target Ratio</span>
                        <span className="text-teal-600">{Math.round((selectedCampaign.actualCollection / selectedCampaign.targetCollection) * 100)}%</span>
                      </div>
                      <div className="w-full bg-white h-2.5 rounded-full overflow-hidden mt-2 border border-slate-150">
                        <div 
                          className="bg-teal-500 h-full rounded-full"
                          style={{ width: `${(selectedCampaign.actualCollection / selectedCampaign.targetCollection) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Target</p>
                        <p className="font-extrabold text-slate-800 mt-0.5">₦{selectedCampaign.targetCollection.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Collected</p>
                        <p className="font-extrabold text-emerald-600 mt-0.5">₦{selectedCampaign.actualCollection.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Defaulters</p>
                        <p className="font-extrabold text-rose-600 mt-0.5">{selectedCampaign.defaulterCount} Parents</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedCampaign(null)}
                    className="mt-6 w-full bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs py-3 rounded-2xl transition-colors cursor-pointer text-center"
                  >
                    Acknowledge & Close
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* =========================================================
              MODAL POPUP 3: TASK COMPREHENSIVE CARD
              ========================================================= */}
          <AnimatePresence>
            {selectedTask && (
              <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl relative"
                >
                  <button 
                    onClick={() => setSelectedTask(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                  >
                    <DynamicLucideIcon name="X" className="w-5 h-5" />
                  </button>

                  <span className="bg-purple-50 text-purple-700 text-[10px] font-extrabold px-3 py-1 rounded-full border border-purple-100 uppercase tracking-widest inline-block">
                    Operational Task
                  </span>
                  
                  <h3 className="text-lg font-bold text-slate-900 mt-4">{selectedTask.title}</h3>
                  <div className="flex gap-2 items-center mt-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      selectedTask.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                      selectedTask.status === 'Overdue' ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedTask.status}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Due Date: {selectedTask.dueDate}</span>
                  </div>

                  <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Task Guidelines</p>
                    <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">{selectedTask.description}</p>
                  </div>

                  <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center space-x-3 text-xs">
                    <div className="bg-slate-200 p-2 rounded-lg text-slate-600">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{selectedTask.assignedUser}</p>
                      <p className="text-[10px] text-slate-400">Assigned Coordinator</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedTask(null)}
                    className="mt-6 w-full bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs py-3 rounded-2xl transition-colors cursor-pointer text-center"
                  >
                    Acknowledge & Close
                  </button>
                </motion.div>
              </div>
            )}

            {/* BUDGET POPUP 1: ALLOCATE EVENT BUDGET FORM */}
            {isCreateBudgetOpen && (
              <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl relative space-y-4"
                >
                  <button 
                    onClick={() => setIsCreateBudgetOpen(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                  >
                    <DynamicLucideIcon name="X" className="w-5 h-5" />
                  </button>

                  <div className="space-y-1">
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-widest inline-block">
                      Allocation Form
                    </span>
                    <h3 className="text-base font-bold text-slate-900">Allocate Event Budget</h3>
                    <p className="text-xs text-slate-500">
                      Instantiate a structured budget limits controller for an active or upcoming event.
                    </p>
                  </div>

                  <form onSubmit={handleCreateNewBudget} className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Pick System Event
                      </label>
                      <select
                        value={newBudgetEventId}
                        onChange={(e) => {
                          setNewBudgetEventId(e.target.value);
                          if (e.target.value === "") {
                            setNewBudgetEventName("");
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Or enter custom event name below --</option>
                        {(data?.currentlyHappening.currentEvents || [])
                          .concat(data?.upcoming.upcomingEvents || [])
                          .map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.title}</option>
                          ))
                        }
                      </select>
                    </div>

                    {newBudgetEventId === "" && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Custom Event Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., Annual Sports Day 2026"
                          value={newBudgetEventName}
                          onChange={(e) => setNewBudgetEventName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Total Allocated Budget Amount (₦)
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="e.g., 5000"
                        value={newBudgetAmount}
                        onChange={(e) => setNewBudgetAmount(Number(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsCreateBudgetOpen(false)}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs py-3 rounded-2xl transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-2xl transition-colors cursor-pointer"
                      >
                        Create Budget
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}

            {/* BUDGET POPUP 2: PRINTABLE AUDIT & EXPENDITURE REPORT */}
            {isReportModalOpen && selectedBudget && (
              <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-slate-200 shadow-2xl relative space-y-6 my-8"
                >
                  <button 
                    onClick={() => {
                      setIsReportModalOpen(false);
                      setSelectedBudget(null);
                    }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer print:hidden"
                  >
                    <DynamicLucideIcon name="X" className="w-5 h-5" />
                  </button>

                  {/* Document Container */}
                  <div id="printable-budget-report-card" className="space-y-6 p-2">
                    {/* Report Header */}
                    <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1">
                      <div className="text-[10px] font-black tracking-widest text-indigo-600 uppercase">Scholastic Financial Board</div>
                      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Rayfield International Academy</h2>
                      <p className="text-xs text-slate-500 font-medium">Official Event Expenditure & Variance Audit Certificate</p>
                    </div>

                    {/* Report Metadata */}
                    <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-200 pb-4 bg-slate-50/50 p-3 rounded-xl">
                      <div>
                        <span className="text-slate-400 font-bold block text-[9px] uppercase">Event Subject</span>
                        <span className="font-extrabold text-slate-800">{selectedBudget.eventName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[9px] uppercase">Audit Stamp Date</span>
                        <span className="font-bold text-slate-800">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[9px] uppercase">Budget Registry Identifier</span>
                        <span className="font-mono font-bold text-slate-600">{selectedBudget.id}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[9px] uppercase">Academic Session & Term</span>
                        <span className="font-bold text-slate-800">{data?.sessionSummary.activeSession.name} ({data?.sessionSummary.currentTerm.name})</span>
                      </div>
                    </div>

                    {/* Financial Summary Table */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Financial Overview</h4>
                      <div className="grid grid-cols-3 gap-2 border border-slate-200 rounded-xl overflow-hidden divide-x divide-slate-200 text-center">
                        <div className="p-3 bg-slate-50">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Total Allocation</span>
                          <span className="text-base font-black text-slate-800">₦{selectedBudget.totalBudget.toLocaleString()}</span>
                        </div>
                        <div className="p-3 bg-indigo-50/30">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Total Disbursed</span>
                          <span className="text-base font-black text-indigo-700">₦{selectedBudget.totalSpent.toLocaleString()}</span>
                        </div>
                        <div className={`p-3 ${selectedBudget.remaining < 0 ? 'bg-rose-50/50' : 'bg-emerald-50/30'}`}>
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">Variance (Unspent)</span>
                          <span className={`text-base font-black ${selectedBudget.remaining < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {selectedBudget.remaining < 0 ? `-₦${Math.abs(selectedBudget.remaining).toLocaleString()}` : `₦${selectedBudget.remaining.toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expenditures Breakdown */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Itemized Ledger Accounts</h4>
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 text-[10px] uppercase">
                              <th className="p-3">Expense Item Name</th>
                              <th className="p-3">Category</th>
                              <th className="p-3 text-right">Disbursed Cost</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(selectedBudget.items || []).length === 0 ? (
                              <tr>
                                <td colSpan={3} className="p-6 text-center text-slate-400 font-medium">
                                  No disbursements recorded in the ledger for this milestone.
                                </td>
                              </tr>
                            ) : (
                              (selectedBudget.items || []).map((it) => (
                                <tr key={it.id} className="hover:bg-slate-50/50">
                                  <td className="p-3 font-semibold text-slate-800">{it.name}</td>
                                  <td className="p-3 text-slate-500 font-medium">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                      {it.category}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right font-bold text-slate-700">₦{it.cost.toLocaleString()}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Auditor commentary */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                      <h5 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Auditor General Findings</h5>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {selectedBudget.remaining < 0 ? (
                          <span className="text-rose-700 font-bold">
                            ⚠️ WARNING: Budget variance exceeded. This event has registered a deficit of ₦${Math.abs(selectedBudget.remaining).toLocaleString()}. Please freeze all further disbursements and investigate the line items immediately.
                          </span>
                        ) : selectedBudget.totalBudget > 0 && (selectedBudget.totalSpent / selectedBudget.totalBudget) > 0.85 ? (
                          <span className="text-amber-700 font-bold">
                            ⚠️ ADVISORY: Budget usage has exhausted over 85% of total allocated funds. Close oversight is recommended for the remaining tasks to avoid overruns.
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-bold">
                            ✓ APPROVED: Expenditures conform perfectly to the scholastic balance sheets. No operational discrepancies have been highlighted by the board.
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Professional Sign-Off Seal Block */}
                    <div className="grid grid-cols-2 gap-8 pt-8 text-[11px] text-slate-400">
                      <div className="border-t border-slate-300 pt-3 text-center">
                        <div className="font-extrabold text-slate-700 font-mono">Principal Auditor General</div>
                        <div>Rayfield Board of Trustees</div>
                      </div>
                      <div className="border-t border-slate-300 pt-3 text-center">
                        <div className="font-extrabold text-slate-700 font-mono">Academic Director Office</div>
                        <div>Scholastic Executive Division</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="grid grid-cols-2 gap-3 pt-2 print:hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setIsReportModalOpen(false);
                        setSelectedBudget(null);
                      }}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs py-3 rounded-2xl transition-colors cursor-pointer"
                    >
                      Close Report
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        window.print();
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-2xl transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Lucide.Printer className="w-4 h-4" />
                      <span>Print Document</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* BUDGET POPUP 3: EDIT DISBURSEMENT ITEMS & PARAMETERS */}
            {isManageBudgetOpen && selectedBudget && (
              <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl relative space-y-6 my-8"
                >
                  <button 
                    onClick={() => {
                      setIsManageBudgetOpen(false);
                      setSelectedBudget(null);
                    }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                  >
                    <DynamicLucideIcon name="X" className="w-5 h-5" />
                  </button>

                  <div className="space-y-1">
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-widest inline-block">
                      Budget & Ledger Controller
                    </span>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      Manage: {selectedBudget.eventName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Instantly modify overall limit parameters or add itemized micro-expenses to sync persistent state.
                    </p>
                  </div>

                  {/* 1. Modify Total Limit */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-3">
                    <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Adjust Total Budget Allocation</h4>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₦</span>
                        <input
                          type="number"
                          placeholder="Change total allocation..."
                          value={editingBudgetLimit}
                          onChange={(e) => setEditingBudgetLimit(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl text-xs pl-7 pr-3 py-2.5 outline-none"
                        />
                      </div>
                      <button
                        onClick={handleUpdateBudgetLimit}
                        className="bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs px-4 rounded-xl transition-colors cursor-pointer shrink-0"
                      >
                        Update Limit
                      </button>
                    </div>
                  </div>

                  {/* 2. Record New Item */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Record New Line Item Expense</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Item Name (e.g., Trophies)"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 outline-none focus:border-indigo-500"
                      />
                      <select
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="Equipment">Equipment</option>
                        <option value="Catering">Catering</option>
                        <option value="Logistics">Logistics</option>
                        <option value="Awards">Awards</option>
                        <option value="Security">Security</option>
                        <option value="Marketing">Marketing</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₦</span>
                        <input
                          type="number"
                          placeholder="Disbursement Cost"
                          value={newItemCost}
                          onChange={(e) => setNewItemCost(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs pl-7 pr-3 py-2.5 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <button
                        onClick={handleAddBudgetItem}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0 animate-none"
                      >
                        <Lucide.Plus className="w-3.5 h-3.5" />
                        <span>Add Expense</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. Existing Itemization Table */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Current Disbursements List</h4>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                            <th className="p-3">Item Details</th>
                            <th className="p-3 text-right">Cost</th>
                            <th className="p-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(selectedBudget.items || []).length === 0 ? (
                            <tr>
                              <td colSpan={3} className="p-6 text-center text-slate-400 font-medium">
                                No line items recorded yet.
                              </td>
                            </tr>
                          ) : (
                            (selectedBudget.items || []).map((it) => (
                              <tr key={it.id} className="hover:bg-slate-50/50">
                                <td className="p-3">
                                  <div className="font-semibold text-slate-800">{it.name}</div>
                                  <div className="text-[10px] text-slate-400 font-medium">{it.category}</div>
                                </td>
                                <td className="p-3 text-right font-bold text-slate-700">₦{it.cost.toLocaleString()}</td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => handleDeleteBudgetItem(it.id)}
                                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                    title="Delete line item"
                                  >
                                    <Lucide.Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsManageBudgetOpen(false);
                      setSelectedBudget(null);
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs py-3 rounded-2xl transition-colors cursor-pointer text-center"
                  >
                    Done Editing
                  </button>
                </motion.div>
              </div>
            )}

            {/* INVENTORY POPUP 1: CREATE STOCK ITEM */}
            {isCreateInventoryOpen && (
              <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl relative space-y-4"
                >
                  <button 
                    onClick={() => setIsCreateInventoryOpen(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                  >
                    <DynamicLucideIcon name="X" className="w-5 h-5" />
                  </button>

                  <div className="space-y-1">
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-widest inline-block">
                      Catalog Registry
                    </span>
                    <h3 className="text-base font-bold text-slate-900">Add New Stock Item</h3>
                    <p className="text-xs text-slate-500">
                      Register a new material, item or general resource in the central school logistics catalog database.
                    </p>
                  </div>

                  <form onSubmit={handleCreateInventoryItem} className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Item Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Exam Registers, Tennis Balls, Certificate Paper"
                        value={newInvName}
                        onChange={(e) => setNewInvName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Category
                        </label>
                        <select
                          value={newInvCategory}
                          onChange={(e) => setNewInvCategory(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 outline-none focus:border-indigo-500 cursor-pointer font-bold text-slate-700"
                        >
                          <option value="Academic">Academic</option>
                          <option value="Sports">Sports</option>
                          <option value="Cultural">Cultural</option>
                          <option value="Administrative">Administrative</option>
                          <option value="General">General</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Stock Units
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. boxes, units, packs"
                          value={newInvUnit}
                          onChange={(e) => setNewInvUnit(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Initial Warehouse Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="e.g. 100"
                        value={newInvQuantity}
                        onChange={(e) => setNewInvQuantity(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 outline-none focus:border-indigo-500 font-bold"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-2xl transition-all cursor-pointer text-center shadow-xs"
                    >
                      Add & Register Item
                    </button>
                  </form>
                </motion.div>
              </div>
            )}

            {/* INVENTORY POPUP 2: SCHEDULE ACTIVITY READINESS CHECKLIST */}
            {isCreateReadinessOpen && (
              <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-100 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto"
                >
                  <button 
                    onClick={() => setIsCreateReadinessOpen(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                  >
                    <DynamicLucideIcon name="X" className="w-5 h-5" />
                  </button>

                  <div className="space-y-1">
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-widest inline-block">
                      Scheduler
                    </span>
                    <h3 className="text-base font-bold text-slate-900">Schedule Activity Checklist</h3>
                    <p className="text-xs text-slate-500">
                      Link material catalog checklists to an upcoming administrative or sporting activity.
                    </p>
                  </div>

                  <form onSubmit={handleCreateReadinessCheck} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Link Event (Optional)
                        </label>
                        <select
                          value={newRcEventId}
                          onChange={(e) => {
                            setNewRcEventId(e.target.value);
                            if (e.target.value === "") {
                              setNewRcEventName("");
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 outline-none focus:border-indigo-500"
                        >
                          <option value="">-- Custom (Enter name below) --</option>
                          {(data?.currentlyHappening.currentEvents || [])
                            .concat(data?.upcoming.upcomingEvents || [])
                            .map(ev => (
                              <option key={ev.id} value={ev.id}>{ev.title}</option>
                            ))
                          }
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Verification Date
                        </label>
                        <input
                          type="date"
                          required
                          value={newRcActivityDate}
                          onChange={(e) => setNewRcActivityDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 outline-none focus:border-indigo-500 font-bold"
                        />
                      </div>
                    </div>

                    {newRcEventId === "" && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Custom Activity Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Science Laboratory Practicals"
                          value={newRcEventName}
                          onChange={(e) => setNewRcEventName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Coordinating Notes
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Enter coordination instructions or guidelines..."
                        value={newRcNotes}
                        onChange={(e) => setNewRcNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 outline-none focus:border-indigo-500 resize-none font-medium"
                      />
                    </div>

                    {/* Requirements builder row inside checklist scheduler */}
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-150 space-y-3">
                      <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Item Requirements Builder</h4>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={tempChecklistItemId}
                          onChange={(e) => {
                            setTempChecklistItemId(e.target.value);
                            if (e.target.value === "") {
                              setTempChecklistName("");
                            }
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl text-xs px-3 py-2 outline-none"
                        >
                          <option value="">-- Custom item not in ledger --</option>
                          {(data?.inventory || []).map(it => (
                            <option key={it.id} value={it.id}>{it.name} ({it.stockQuantity} ready)</option>
                          ))}
                        </select>

                        {tempChecklistItemId === "" && (
                          <input
                            type="text"
                            placeholder="Custom item name"
                            value={tempChecklistName}
                            onChange={(e) => setTempChecklistName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl text-xs px-3 py-2 outline-none"
                          />
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Required quantity"
                          value={tempChecklistRequired}
                          onChange={(e) => setTempChecklistRequired(Number(e.target.value))}
                          className="bg-white border border-slate-200 rounded-xl text-xs px-3 py-2 outline-none w-1/2 font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            let nameToUse = tempChecklistName;
                            let currentStock = 0;
                            if (tempChecklistItemId) {
                              const found = (data?.inventory || []).find(it => it.id === tempChecklistItemId);
                              if (found) {
                                nameToUse = found.name;
                                currentStock = found.stockQuantity;
                              }
                            }
                            if (!nameToUse) return;

                            setNewRcChecklistItems(prev => [
                              ...prev,
                              {
                                itemId: tempChecklistItemId,
                                name: nameToUse,
                                requiredQuantity: Number(tempChecklistRequired) || 10,
                                availableQuantity: tempChecklistItemId ? currentStock : Number(tempChecklistRequired) || 10
                              }
                            ]);
                            setTempChecklistItemId("");
                            setTempChecklistName("");
                            setTempChecklistRequired(10);
                          }}
                          className="w-1/2 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-xl cursor-pointer py-2 transition-colors inline-flex items-center justify-center gap-1"
                        >
                          <Lucide.Plus className="w-3.5 h-3.5" />
                          <span>Add Requirement</span>
                        </button>
                      </div>

                      {/* Builder display list */}
                      {newRcChecklistItems.length > 0 && (
                        <div className="border border-slate-200 rounded-xl bg-white max-h-24 overflow-y-auto divide-y divide-slate-100 text-xs">
                          {newRcChecklistItems.map((rcItem, rcIdx) => (
                            <div key={rcIdx} className="p-2 flex justify-between items-center">
                              <span className="font-bold text-slate-700">{rcItem.name} ({rcItem.requiredQuantity} units)</span>
                              <button
                                type="button"
                                onClick={() => setNewRcChecklistItems(prev => prev.filter((_, i) => i !== rcIdx))}
                                className="text-rose-500 hover:text-rose-700 font-bold"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-2xl transition-all cursor-pointer text-center shadow-xs"
                    >
                      Authorize Checklist Schedule
                    </button>
                  </form>
                </motion.div>
              </div>
            )}

            {/* INVENTORY POPUP 3: MANAGE ACTIVE READINESS CHECKLIST */}
            {isManageReadinessOpen && selectedReadinessCheck && (
              <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-100 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto"
                >
                  <button 
                    onClick={() => {
                      setIsManageReadinessOpen(false);
                      setSelectedReadinessCheck(null);
                    }}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                  >
                    <DynamicLucideIcon name="X" className="w-5 h-5" />
                  </button>

                  <div className="space-y-1">
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest inline-block">
                      Checklist Auditor
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{selectedReadinessCheck.eventName}</h3>
                    <p className="text-xs text-slate-500">
                      Instantly alter required itemization, write coordination guidelines or update available ledger metrics.
                    </p>
                  </div>

                  {/* Edit Coordinating Notes */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-3">
                    <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Verification Notes</h4>
                    <textarea
                      rows={2}
                      placeholder="Coordinating notes..."
                      value={editRcNotes}
                      onChange={(e) => setEditRcNotes(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl text-xs px-3 py-2 outline-none resize-none"
                    />
                    <button
                      onClick={handleUpdateChecklistNotes}
                      className="bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                    >
                      Save Notes
                    </button>
                  </div>

                  {/* Add New Line Requirement */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Add New Material Requirement</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newChecklistRequirementId}
                        onChange={(e) => {
                          setNewChecklistRequirementId(e.target.value);
                          if (e.target.value === "") {
                            setNewChecklistRequirementName("");
                          }
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Custom (type name below) --</option>
                        {(data?.inventory || []).map(it => (
                          <option key={it.id} value={it.id}>{it.name} ({it.stockQuantity} in stock)</option>
                        ))}
                      </select>

                      {newChecklistRequirementId === "" && (
                        <input
                          type="text"
                          placeholder="Material Name"
                          value={newChecklistRequirementName}
                          onChange={(e) => setNewChecklistRequirementName(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 outline-none focus:border-indigo-500"
                        />
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Required Qty"
                        value={newChecklistRequirementQty}
                        onChange={(e) => setNewChecklistRequirementQty(Number(e.target.value))}
                        className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2.5 outline-none focus:border-indigo-500 font-bold flex-1"
                      />
                      <button
                        onClick={handleAddReadinessChecklistRequirement}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 rounded-xl transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Lucide.Plus className="w-3.5 h-3.5" />
                        <span>Add Requirement</span>
                      </button>
                    </div>
                  </div>

                  {/* Checklist Items Table */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Checklist Status Audit</h4>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                            <th className="p-3">Material Required</th>
                            <th className="p-3 text-center">Required</th>
                            <th className="p-3 text-center">Warehouse Stock</th>
                            <th className="p-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(selectedReadinessCheck.items || []).length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-slate-400 font-medium">
                                No requirements set for this checklist.
                              </td>
                            </tr>
                          ) : (
                            (selectedReadinessCheck.items || []).map((it, idx) => {
                              const isShort = it.availableQuantity < it.requiredQuantity;
                              return (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-3">
                                    <div className="font-semibold text-slate-800">{it.name}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">ID: {it.itemId || 'Custom'}</div>
                                  </td>
                                  <td className="p-3 text-center font-bold text-slate-700">{it.requiredQuantity}</td>
                                  <td className="p-3 text-center">
                                    <span className={`font-bold ${isShort ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>
                                      {it.availableQuantity}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="flex items-center justify-center space-x-1">
                                      {isShort && it.itemId && (
                                        <button
                                          onClick={() => handleUpdateStockQuantity(it.itemId, it.requiredQuantity)}
                                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[9px] font-bold px-2 py-1 rounded transition-colors"
                                          title="Quickly procure required units"
                                        >
                                          Refill
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleDeleteReadinessChecklistRequirement(it.itemId || it.name)}
                                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded transition-colors cursor-pointer"
                                        title="Delete requirement"
                                      >
                                        <Lucide.Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsManageReadinessOpen(false);
                      setSelectedReadinessCheck(null);
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs py-3 rounded-2xl transition-colors cursor-pointer text-center"
                  >
                    Close Auditor
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      ) : (
        <div className="bg-slate-50 border border-dashed border-slate-200 p-12 text-center rounded-2xl text-slate-400 max-w-md mx-auto">
          No operations telemetry could be determined.
        </div>
      )}
    </div>
  );
}
