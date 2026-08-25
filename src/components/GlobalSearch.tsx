import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  X, 
  CornerDownLeft, 
  FileText, 
  Users, 
  UserPlus, 
  Sparkles, 
  Shield, 
  ArrowRight,
  History,
  Star,
  Settings,
  ShieldAlert,
  Moon,
  Sun,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PrimaryModule, SubmenuItem } from './Navigation';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  modules: PrimaryModule[];
  currentSimulatedRole: string;
  isTabRestricted: (tab: string, role: string) => boolean;
  setActiveTab: (tab: any) => void;
  onAddStudent?: () => void;
  onAddTeacher?: () => void;
  onBulkImport?: () => void;
  themeMode: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark') => void;
  favourites: string[];
  toggleFavourite: (id: string) => void;
  recentlyVisited: string[];
  onForceReset?: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  modules,
  currentSimulatedRole,
  isTabRestricted,
  setActiveTab,
  onAddStudent,
  onAddTeacher,
  onBulkImport,
  themeMode,
  setThemeMode,
  favourites,
  toggleFavourite,
  recentlyVisited,
  onForceReset
}) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Handle Ctrl+K / Cmd+K and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Structure search items
  const searchResults = useMemo(() => {
    const cleanedQuery = query.toLowerCase().trim();

    // 1. Pages/Submenus matching
    const pageItems: any[] = [];
    modules.forEach(mod => {
      mod.submenu.forEach(sub => {
        const isLocked = isTabRestricted(sub.mappedTab, currentSimulatedRole);
        const matchesQuery = !cleanedQuery || 
          sub.name.toLowerCase().includes(cleanedQuery) || 
          sub.description.toLowerCase().includes(cleanedQuery) ||
          mod.name.toLowerCase().includes(cleanedQuery);
        
        if (matchesQuery) {
          pageItems.push({
            type: 'page',
            id: sub.id,
            name: sub.name,
            description: sub.description,
            parentName: mod.name,
            icon: mod.icon,
            mappedTab: sub.mappedTab,
            isLocked,
            action: () => {
              if (isLocked) {
                alert(`🔒 ACCESS RESTRICTED: Your simulated role "${currentSimulatedRole}" does not have privileges to access the "${sub.name}" sub-function.`);
                return;
              }
              setActiveTab(sub.mappedTab);
              onClose();
            }
          });
        }
      });
    });

    // 2. Quick Actions matching
    const actionItems = [
      {
        type: 'action',
        id: 'act-add-student',
        name: 'Add New Student Record',
        description: 'Open creation wizard for a new student registration',
        icon: UserPlus,
        matches: ['add student', 'create student', 'new student', 'enroll', 'registration'],
        action: () => {
          onAddStudent?.();
          onClose();
        }
      },
      {
        type: 'action',
        id: 'act-add-teacher',
        name: 'Register Staff/Teacher Account',
        description: 'Onboard a new academic teacher, subject master or administrator',
        icon: UserPlus,
        matches: ['add teacher', 'new teacher', 'add staff', 'new staff', 'register teacher', 'hr'],
        action: () => {
          onAddTeacher?.();
          onClose();
        }
      },
      {
        type: 'action',
        id: 'act-bulk-import',
        name: 'Spreadsheet Excel/CSV Bulk Import',
        description: 'Upload spreadsheet logs to ingest massive datasets',
        icon: FileText,
        matches: ['csv', 'excel', 'import', 'bulk import', 'upload student'],
        action: () => {
          onBulkImport?.();
          onClose();
        }
      },
      {
        type: 'action',
        id: 'act-theme-toggle',
        name: `Switch Theme to ${themeMode === 'light' ? 'Dark' : 'Light'} Mode`,
        description: `Change display aesthetics to high contrast ${themeMode === 'light' ? 'Slate Dark' : 'Vibrant Light'} mode`,
        icon: themeMode === 'light' ? Moon : Sun,
        matches: ['dark mode', 'light mode', 'theme', 'color', 'black', 'white', 'night'],
        action: () => {
          setThemeMode(themeMode === 'light' ? 'dark' : 'light');
          onClose();
        }
      },
      {
        type: 'action',
        id: 'act-factory-reset',
        name: 'Force Local Database Reset',
        description: 'Clear local caches and restore default sample institution dataset',
        icon: Database,
        matches: ['factory reset', 'clear cache', 'reset database', 'purge data', 'restore'],
        action: () => {
          if (onForceReset) {
            onForceReset();
          } else {
            if (confirm("Restore initial sample database records? Everything else will be cleared.")) {
              localStorage.clear();
              window.location.reload();
            }
          }
          onClose();
        }
      }
    ].filter(act => !cleanedQuery || act.name.toLowerCase().includes(cleanedQuery) || act.description.toLowerCase().includes(cleanedQuery) || act.matches.some(m => m.includes(cleanedQuery)));

    // Combine sections
    let combined: any[] = [];
    
    // If query is empty, show Recent and Favourites first
    if (!cleanedQuery) {
      // Add Recent Items
      const recentItems: any[] = [];
      recentlyVisited.forEach(id => {
        modules.forEach(mod => {
          const sub = mod.submenu.find(s => s.id === id);
          if (sub) {
            recentItems.push({
              type: 'recent',
              id: `rec-${sub.id}`,
              name: sub.name,
              description: `Last visited in ${mod.name}`,
              parentName: mod.name,
              icon: History,
              action: () => {
                setActiveTab(sub.mappedTab);
                onClose();
              }
            });
          }
        });
      });

      // Add Favourited items
      const starredItems: any[] = [];
      favourites.forEach(id => {
        modules.forEach(mod => {
          const sub = mod.submenu.find(s => s.id === id);
          if (sub) {
            starredItems.push({
              type: 'favourite',
              id: `fav-${sub.id}`,
              name: sub.name,
              description: `Starred item in ${mod.name}`,
              parentName: mod.name,
              icon: Star,
              action: () => {
                setActiveTab(sub.mappedTab);
                onClose();
              }
            });
          }
        });
      });

      if (starredItems.length > 0) {
        combined.push({ title: 'Starred Favourites', items: starredItems });
      }
      if (recentItems.length > 0) {
        combined.push({ title: 'Recently Navigated Pages', items: recentItems });
      }
      
      // Default actions
      combined.push({ title: 'Fast Administrative Actions', items: actionItems.slice(0, 3) });
    } else {
      // Filtered items
      if (pageItems.length > 0) {
        combined.push({ title: 'Matching ERP Sub-functions', items: pageItems });
      }
      if (actionItems.length > 0) {
        combined.push({ title: 'Quick Action Commands', items: actionItems });
      }
    }

    return combined;
  }, [query, modules, currentSimulatedRole, isTabRestricted, themeMode, setThemeMode, favourites, recentlyVisited, onAddStudent, onAddTeacher, onBulkImport, onForceReset, setActiveTab, onClose]);

  // Flattened items for easy arrow key index tracking
  const flatItems = useMemo(() => {
    const flat: any[] = [];
    searchResults.forEach(section => {
      section.items.forEach((item: any) => {
        flat.push(item);
      });
    });
    return flat;
  }, [searchResults]);

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[activeIndex]) {
        flatItems[activeIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/45 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div 
        onKeyDown={handleKeyDown}
        className="relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[75vh]"
        id="sams-spotlight-modal"
      >
        {/* Search header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <Search className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages, tools, roles, actions... (e.g. 'timetable', 'add student')"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            className="w-full bg-transparent border-none outline-none py-1.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-400 select-none">
            ESC
          </kbd>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-3 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[50vh]">
          {flatItems.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <Search className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No matches found for "{query}"</p>
              <p className="text-[10px] text-slate-400">Try searching for other primary modules or commands like 'timetable' or 'audit'</p>
            </div>
          ) : (
            searchResults.map((section: any, sIdx: number) => {
              // Calculate start flat index for this section to highlight correct item
              let sectionFlatStartIdx = 0;
              for (let i = 0; i < sIdx; i++) {
                sectionFlatStartIdx += searchResults[i].items.length;
              }

              return (
                <div key={section.title} className="space-y-1.5">
                  <h3 className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3">
                    {section.title}
                  </h3>
                  <div className="space-y-0.5">
                    {section.items.map((item: any, iIdx: number) => {
                      const flatIndex = sectionFlatStartIdx + iIdx;
                      const isHighlighted = activeIndex === flatIndex;
                      const Icon = item.icon || FileText;

                      return (
                        <button
                          key={item.id}
                          onClick={item.action}
                          onMouseEnter={() => setActiveIndex(flatIndex)}
                          className={`w-full flex items-center justify-between text-left p-3 rounded-xl transition-all duration-100 cursor-pointer ${
                            isHighlighted 
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                              : 'bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center space-x-3.5 min-w-0">
                            <div className={`p-1.5 rounded-lg shrink-0 ${
                              isHighlighted 
                                ? 'bg-indigo-500 text-white' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold leading-normal">
                                {item.parentName && (
                                  <span className={`text-[10px] font-semibold mr-1.5 ${
                                    isHighlighted ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'
                                  }`}>
                                    {item.parentName} &gt;
                                  </span>
                                )}
                                {item.name}
                              </p>
                              <p className={`text-[9px] truncate leading-none mt-0.5 ${
                                isHighlighted ? 'text-indigo-150' : 'text-slate-400 dark:text-slate-500'
                              }`}>
                                {item.description}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center space-x-2 pl-2">
                            {item.isLocked && (
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                                isHighlighted ? 'bg-indigo-500 text-white' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                              }`}>
                                Restricted
                              </span>
                            )}
                            {isHighlighted && (
                              <div className="flex items-center text-[10px] font-mono space-x-1 opacity-80">
                                <span className="text-[11px]">Select</span>
                                <CornerDownLeft className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Search Footer info */}
        <div className="bg-slate-50 dark:bg-slate-900/40 px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-medium shrink-0">
          <div className="flex items-center space-x-4">
            <span className="flex items-center"><span className="font-bold mr-1">↑↓</span> Navigate</span>
            <span className="flex items-center"><span className="font-bold mr-1">⏎</span> Select</span>
          </div>
          <span className="hidden sm:inline font-mono text-[9px] uppercase tracking-wider text-slate-400/80 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            SAMS Smart Console • Instant Access
          </span>
        </div>
      </div>
    </div>
  );
};
