import React, { useState, useMemo } from 'react';
import { 
  X, 
  Check, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Trash2, 
  Bell, 
  Volume2, 
  Moon, 
  Sun, 
  LayoutGrid, 
  FolderHeart, 
  Star, 
  Smartphone, 
  Mail, 
  Settings,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PrimaryModule, SubmenuItem } from './Navigation';

export interface UserPreferences {
  theme: 'light' | 'dark';
  defaultLandingPage: string; // submenu mappedTab
  favourites: string[]; // submenu IDs
  quickShortcuts: string[]; // submenu IDs
  notifications: {
    emailAlerts: boolean;
    smsAlerts: boolean;
    systemSound: boolean;
    frequency: 'realtime' | 'daily' | 'weekly' | 'off';
  };
}

interface PersonalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUser: any;
  systemUsers: any[];
  onSwitchUser: (userId: string) => void;
  userPrefs: UserPreferences;
  onUpdatePrefs: (prefs: Partial<UserPreferences>) => void;
  modules: PrimaryModule[];
}

export const PersonalizationModal: React.FC<PersonalizationModalProps> = ({
  isOpen,
  onClose,
  activeUser,
  systemUsers,
  onSwitchUser,
  userPrefs,
  onUpdatePrefs,
  modules
}) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'navigation' | 'shortcuts' | 'notifications'>('profile');

  // Flattened submenu list for selection
  const allSubmenuItems = useMemo(() => {
    return modules.flatMap(mod => 
      mod.submenu.map(sub => ({
        ...sub,
        parentModuleName: mod.name,
        parentIcon: mod.icon
      }))
    );
  }, [modules]);

  // Handle shortcut reordering (Move Up)
  const handleMoveShortcutUp = (index: number) => {
    if (index === 0) return;
    const reordered = [...userPrefs.quickShortcuts];
    const item = reordered[index];
    reordered[index] = reordered[index - 1];
    reordered[index - 1] = item;
    onUpdatePrefs({ quickShortcuts: reordered });
  };

  // Handle shortcut reordering (Move Down)
  const handleMoveShortcutDown = (index: number) => {
    if (index === userPrefs.quickShortcuts.length - 1) return;
    const reordered = [...userPrefs.quickShortcuts];
    const item = reordered[index];
    reordered[index] = reordered[index + 1];
    reordered[index + 1] = item;
    onUpdatePrefs({ quickShortcuts: reordered });
  };

  // Handle adding a shortcut
  const handleAddShortcut = (submenuId: string) => {
    if (userPrefs.quickShortcuts.includes(submenuId)) return;
    if (userPrefs.quickShortcuts.length >= 8) {
      alert("⚠️ LIMIT REACHED\nYou can configure a maximum of 8 quick shortcuts at once to prevent visual workspace clutter.");
      return;
    }
    onUpdatePrefs({ quickShortcuts: [...userPrefs.quickShortcuts, submenuId] });
  };

  // Handle removing a shortcut
  const handleRemoveShortcut = (submenuId: string) => {
    onUpdatePrefs({ quickShortcuts: userPrefs.quickShortcuts.filter(id => id !== submenuId) });
  };

  // Toggle dynamic pinning for a submenu item
  const handleToggleFavourite = (submenuId: string) => {
    const isPinned = userPrefs.favourites.includes(submenuId);
    const updated = isPinned 
      ? userPrefs.favourites.filter(id => id !== submenuId)
      : [...userPrefs.favourites, submenuId];
    onUpdatePrefs({ favourites: updated });
  };

  // Helper to trigger a sample notification sound effect to verify
  const playSampleNotification = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
      
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn("Audio Context blocked or unsupported:", e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER BAR */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">
                SAMS Workspace Personalization
              </h2>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase mt-1">
                Aesthetic theme, pinning & shortcut console
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all cursor-pointer shadow-none! border-none!"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTAINER WITH SPLIT SIDEBAR & CONTENT */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          
          {/* MODAL LEFT SIDE NAVIGATION */}
          <div className="w-full md:w-56 bg-slate-50 dark:bg-slate-900/40 border-r border-slate-100 dark:border-slate-800 p-4 space-y-1 shrink-0">
            {[
              { id: 'profile' as const, label: '👤 User Profile & Account', desc: 'Active simulated session' },
              { id: 'navigation' as const, label: '📍 Navigation & Landing', desc: 'Landing view & favourites' },
              { id: 'shortcuts' as const, label: '⚡ Quick Shortcuts', desc: 'Custom header actions list' },
              { id: 'notifications' as const, label: '🔔 Alerts & Notifications', desc: 'Channels & frequency rules' }
            ].map(tab => {
              const isActive = activeSettingsTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSettingsTab(tab.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all cursor-pointer block border-none! shadow-none! ${
                    isActive 
                      ? 'bg-indigo-600 text-white font-extrabold shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <p className="text-xs font-bold leading-none">{tab.label}</p>
                  <p className={`text-[9px] mt-1 font-medium ${isActive ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
                    {tab.desc}
                  </p>
                </button>
              );
            })}

            {/* QUICK THEME SWITCHER BANNER IN MODAL MENU */}
            <div className="pt-4 mt-4 border-t border-slate-200/60 dark:border-slate-800/80">
              <span className="text-[9px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider block px-2 mb-2">
                Aesthetic Mode
              </span>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => onUpdatePrefs({ theme: 'light' })}
                  className={`flex items-center justify-center py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all border-none! shadow-none! ${
                    userPrefs.theme === 'light'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 mr-1" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdatePrefs({ theme: 'dark' })}
                  className={`flex items-center justify-center py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all border-none! shadow-none! ${
                    userPrefs.theme === 'dark'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 mr-1" />
                  <span>Dark</span>
                </button>
              </div>
            </div>
          </div>

          {/* MODAL CONTENT PANEL */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
            
            {/* TAB: PROFILE & ACCOUNT */}
            {activeSettingsTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Simulated Account Selector
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic mt-0.5">
                    Select a personnel credentials identity card to personalize their specific workspace options.
                  </p>
                </div>

                {/* CURRENT ACTIVE USER PROFILE DISPLAY CARD */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white text-lg font-black flex items-center justify-center shadow-lg shrink-0">
                    {activeUser.name.charAt(0)}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 justify-center sm:justify-start">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white leading-none">
                        {activeUser.name}
                      </span>
                      <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 self-center">
                        {activeUser.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono">{activeUser.email}</p>
                    <div className="grid grid-cols-2 gap-4 mt-3 text-left pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Assigned Campus</p>
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{activeUser.branch === 'All' ? 'All Branches' : `${activeUser.branch} Campus`}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Session Access Count</p>
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono">{activeUser.accessCount || 0} times logged</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SWITCH IDENTITY ACCORDION LIST */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                    Choose Another System Login to Switch:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {systemUsers.map(usr => {
                      const isMe = usr.id === activeUser.id;
                      return (
                        <button
                          key={usr.id}
                          type="button"
                          onClick={() => {
                            onSwitchUser(usr.id);
                          }}
                          className={`flex items-start text-left p-2.5 rounded-xl border transition-all cursor-pointer shadow-xs ${
                            isMe 
                              ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10' 
                              : 'border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                            isMe ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {usr.name.charAt(0)}
                          </div>
                          <div className="min-w-0 pl-2">
                            <p className="text-xs font-extrabold truncate text-slate-900 dark:text-white leading-normal flex items-center gap-1">
                              {usr.name}
                              {isMe && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
                            </p>
                            <p className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
                              {usr.role}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: NAVIGATION & LANDING */}
            {activeSettingsTab === 'navigation' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Landing Page & Favourites Pinned
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic mt-0.5">
                    Customize which module launches automatically when you log in, and configure which sub-functions are pinned to the sidebar.
                  </p>
                </div>

                {/* DEFAULT LANDING PAGE SELECTOR */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold uppercase text-slate-400 tracking-wider block">
                    🚀 Default Starting View after Login:
                  </label>
                  <select
                    value={userPrefs.defaultLandingPage}
                    onChange={(e) => onUpdatePrefs({ defaultLandingPage: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 shadow-sm"
                  >
                    <option value="overview">Executive Dashboard Overview (overview)</option>
                    <option value="operations">SAMS Operations Dashboard (operations)</option>
                    <option value="students">Student Directory Hub (students)</option>
                    <option value="teachers">Academic Staff Directory (teachers)</option>
                    <option value="classes">Academics Section & Classes (classes)</option>
                    <option value="grades">Result & Report Card Entry Desk (grades)</option>
                    <option value="attendance_desk">Attendance Desk (attendance_desk)</option>
                    <option value="parent">Parent Portal Monitor (parent)</option>
                    <option value="admission">Admissions Applications Desk (admission)</option>
                    <option value="inventory">Inventory Catalog & Ledger (inventory)</option>
                    <option value="calendar">School Events & Holidays (calendar)</option>
                    <option value="scheduler">Period Timetable Scheduler (scheduler)</option>
                    <option value="health">Executive Institutional Health (health)</option>
                    <option value="financial_settings">Financial Settings Control (financial_settings)</option>
                    <option value="school_setup">School Core Setup Console (school_setup)</option>
                    <option value="security">Security & Access Management (security)</option>
                    <option value="assistant">AI Chat Assistant (assistant)</option>
                  </select>
                </div>

                {/* PINNED FAVOURITES MANAGEMENT */}
                <div className="space-y-2">
                  <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider block flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>Pin Favourites to Sidebar ({userPrefs.favourites.length}):</span>
                  </span>
                  
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 bg-slate-50/20 dark:bg-slate-950/20 scrollbar-thin">
                    {allSubmenuItems.map(item => {
                      const isPinned = userPrefs.favourites.includes(item.id);
                      return (
                        <div 
                          key={`pref-fav-${item.id}`} 
                          className="flex items-center justify-between p-2.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <div className="min-w-0 pr-3">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-normal">
                              {item.name}
                            </p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                              {item.parentModuleName} &bull; {item.description}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleFavourite(item.id)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-none! ${
                              isPinned
                                ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/60'
                                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 dark:bg-slate-900 dark:border-slate-800'
                            }`}
                            title={isPinned ? "Unpin from favourites" : "Pin as favourite"}
                          >
                            <Star className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-400 text-amber-500' : ''}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: QUICK SHORTCUTS */}
            {activeSettingsTab === 'shortcuts' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Quick Navigation Shortcuts Reorder
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic mt-0.5">
                    Customize your top bar quick links. Add up to 8 actions and order them by priority for rapid access across the entire school application.
                  </p>
                </div>

                {/* CURRENT SHORTCUTS WITH REORDER BUTTONS */}
                <div className="space-y-2">
                  <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider block">
                    Your Active Shortcuts ({userPrefs.quickShortcuts.length} / 8):
                  </span>

                  {userPrefs.quickShortcuts.length === 0 ? (
                    <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-400">
                      <LayoutGrid className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      No quick links configured yet. Use the selector below to add shortcut keys.
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-150 dark:divide-slate-800/60 bg-white dark:bg-slate-950/40">
                      {userPrefs.quickShortcuts.map((id, index) => {
                        const sub = allSubmenuItems.find(s => s.id === id);
                        if (!sub) return null;
                        return (
                          <div key={`shortcut-list-${id}`} className="flex items-center justify-between p-2.5 hover:bg-slate-50/50 transition-colors">
                            <div className="min-w-0 pr-3 flex items-center space-x-2">
                              <div className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                                <span className="text-[9px] font-bold">{index + 1}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                  {sub.name}
                                </p>
                                <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                                  {sub.parentModuleName}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleMoveShortcutUp(index)}
                                disabled={index === 0}
                                className="p-1 rounded-md border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed bg-transparent shadow-none!"
                                title="Move link up"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveShortcutDown(index)}
                                disabled={index === userPrefs.quickShortcuts.length - 1}
                                className="p-1 rounded-md border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed bg-transparent shadow-none!"
                                title="Move link down"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveShortcut(id)}
                                className="p-1 rounded-md border border-rose-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer bg-transparent shadow-none! ml-1.5"
                                title="Remove shortcut"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ADD SHORTCUT SELECTOR */}
                <div className="space-y-2 pt-4 border-t border-slate-200/60 dark:border-slate-800/80">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                    Available Sub-functions to Add to Shortcuts:
                  </span>
                  
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 bg-slate-50/20 dark:bg-slate-950/20 scrollbar-thin">
                    {allSubmenuItems.map(item => {
                      const isAdded = userPrefs.quickShortcuts.includes(item.id);
                      return (
                        <div 
                          key={`add-sh-${item.id}`} 
                          className="flex items-center justify-between p-2 hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors"
                        >
                          <div className="min-w-0 pr-3">
                            <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 truncate">
                              {item.name}
                            </p>
                            <p className="text-[8px] text-slate-400 dark:text-slate-500 font-semibold truncate uppercase tracking-widest mt-0.5">
                              {item.parentModuleName}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddShortcut(item.id)}
                            disabled={isAdded}
                            className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer shadow-none! ${
                              isAdded
                                ? 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-800 cursor-default'
                                : 'bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:bg-slate-900 dark:border-indigo-950'
                            }`}
                          >
                            {isAdded ? 'Added' : '+ Add link'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ALERTS & NOTIFICATIONS */}
            {activeSettingsTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Alert Channels & Frequency Preferences
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic mt-0.5">
                    Customize your alert delivery thresholds. These rules help keep administrative supervisors from experiencing notification fatigue.
                  </p>
                </div>

                {/* TOGGLE OPTIONS */}
                <div className="space-y-3">
                  <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider block">
                    Active Delivery Channels:
                  </span>

                  {/* CHANNEL: EMAIL */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/20">
                    <div className="flex items-start space-x-3 pr-4">
                      <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-normal">Email Alerts</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Receive transaction audits, reports and logins to {activeUser.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpdatePrefs({ 
                        notifications: { ...userPrefs.notifications, emailAlerts: !userPrefs.notifications.emailAlerts } 
                      })}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                        userPrefs.notifications.emailAlerts ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
                        userPrefs.notifications.emailAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* CHANNEL: SMS */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/20">
                    <div className="flex items-start space-x-3 pr-4">
                      <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-normal">SMS / WhatsApp Digests</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Critical school alerts and emergency overrides pushed to {activeUser.phone || '+234 803 000 0000'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpdatePrefs({ 
                        notifications: { ...userPrefs.notifications, smsAlerts: !userPrefs.notifications.smsAlerts } 
                      })}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                        userPrefs.notifications.smsAlerts ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
                        userPrefs.notifications.smsAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* CHANNEL: SYSTEM SOUNDS */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/20">
                    <div className="flex items-start space-x-3 pr-4">
                      <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center">
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-normal flex items-center gap-1.5">
                          <span>Workspace Interactive Audio Chimes</span>
                          <button
                            type="button"
                            onClick={playSampleNotification}
                            className="text-[9px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded px-1.5 py-0.5 font-bold cursor-pointer border-none! shadow-none!"
                          >
                            Play Sample
                          </button>
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">Trigger reactive sound effects for action completions, saves, or error dialogues</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpdatePrefs({ 
                        notifications: { ...userPrefs.notifications, systemSound: !userPrefs.notifications.systemSound } 
                      })}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                        userPrefs.notifications.systemSound ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
                        userPrefs.notifications.systemSound ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* ALERT FREQUENCY RULE */}
                <div className="space-y-2 pt-4 border-t border-slate-150 dark:border-slate-800">
                  <label className="text-xs font-extrabold uppercase text-slate-400 tracking-wider block">
                    📊 Alert Summarization Thresholds:
                  </label>
                  <select
                    value={userPrefs.notifications.frequency}
                    onChange={(e) => onUpdatePrefs({ 
                      notifications: { ...userPrefs.notifications, frequency: e.target.value as any } 
                    })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 shadow-sm"
                  >
                    <option value="realtime">🚀 Immediate Alerts (Every action notifies immediately)</option>
                    <option value="daily">📅 Daily Digest (Consolidate into daily morning summary)</option>
                    <option value="weekly">📆 Weekly Summary (Friday afternoon ledger synthesis)</option>
                    <option value="off">📴 Do Not Disturb (Mute all non-critical overrides)</option>
                  </select>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* BOTTOM MODAL ACTION BAR */}
        <div className="px-6 py-4 border-t border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Preferences sync with local browser storage</span>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md hover:scale-102 border-none!"
          >
            Save and Apply
          </button>
        </div>

      </div>
    </div>
  );
};
