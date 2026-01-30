import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Task, Checklist } from './types';
import { ICONS } from './constants';
import { TaskItem } from './components/TaskItem';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
// import { getUserChecklists, saveUserChecklists } from "./firestoreService";
// import { getUserChecklists, updateChecklist } from "./firestoreService";
import { getUserChecklists, updateChecklist, saveUserChecklists } from "./firestoreService";
import { loginWithGoogle, logout } from "./authService";
import { User } from "firebase/auth";



const App: React.FC = () => {
  const [checklists, setChecklists] = useState<Checklist[]>(() => {
    const saved = localStorage.getItem('multi_checklist_app_data');
    if (saved) return JSON.parse(saved);
    return [{
      id: 'default',
      name: 'My Tasks',
      tasks: [
        { id: '1', text: 'Welcome to your checklist', completed: false, category: 'cat-1', createdAt: Date.now() },
        { id: '2', text: 'Add items below to get started', completed: false, category: 'cat-1', createdAt: Date.now() },
      ]
    }];
  });

  const [activeListId, setActiveListId] = useState<string>(() => {
    return localStorage.getItem('active_checklist_id') || 'default';
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newEntryValue, setNewEntryValue] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedExportId, setSelectedExportId] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);


  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newEntryTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Ensure we always have a valid list to render
  const activeList = checklists.find(l => l.id === activeListId) || checklists[0] || { id: 'fallback', name: 'No Lists', tasks: [] };

  useEffect(() => {
    if (!selectedExportId && activeList.id) {
      setSelectedExportId(activeList.id);
    }
  }, [activeList.id]);

  useEffect(() => {
    localStorage.setItem('multi_checklist_app_data', JSON.stringify(checklists));
  }, [checklists, user]);

  useEffect(() => {
    localStorage.setItem('active_checklist_id', activeListId);
  }, [activeListId]);

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser?.email?.endsWith("@q4inc.com")) {
      setUser(currentUser);

      const remoteChecklists = await getUserChecklists(currentUser);
      if (remoteChecklists.length > 0) {
        setChecklists(remoteChecklists);
        setActiveListId(remoteChecklists[0].id);
      }
    } else {
      setUser(null);
    }

    setLoadingAuth(false);
  });

  return () => unsubscribe();
  }, []);



  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
  if (!user || !activeList) return;
  if (!activeList.id) return;
  if (!activeList.name) return;

  const timeout = setTimeout(() => {
    updateChecklist(user, activeList.id, {
      title: activeList.name,
      tasks: activeList.tasks ?? [],
      updatedAt: Date.now()
    });
  }, 1500);

  return () => clearTimeout(timeout);
}, [activeList, user]);




  // Resilience: updateActiveList now targets the ACTUAL displayed list ID
  const updateActiveList = useCallback((updater: (list: Checklist) => Checklist) => {
    setChecklists(prev => {
      const targetId = activeList.id;
      return prev.map(l => l.id === targetId ? updater(l) : l);
    });
  }, [activeList.id]);

  const addTask = useCallback((text?: string) => {
    const taskText = text || newEntryValue.trim();
    if (!taskText) return;
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      text: taskText,
      completed: false,
      category: 'cat-1',
      createdAt: Date.now()
    };
    updateActiveList(list => ({ ...list, tasks: [...list.tasks, newTask] }));
    if (!text) setNewEntryValue('');
    
    // Auto-focus the new entry again after creation
    setTimeout(() => {
      newEntryTextareaRef.current?.focus();
    }, 0);
  }, [newEntryValue, updateActiveList]);

  const toggleTask = useCallback((id: string) => {
    updateActiveList(list => ({
      ...list,
      tasks: list.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    }));
  }, [updateActiveList]);

  const updateTaskText = useCallback((id: string, newText: string) => {
    updateActiveList(list => ({
      ...list,
      tasks: list.tasks.map(t => t.id === id ? { ...t, text: newText } : t)
    }));
  }, [updateActiveList]);

  const deleteTask = useCallback((id: string) => {
    updateActiveList(list => ({
      ...list,
      tasks: list.tasks.filter(t => t.id !== id)
    }));
  }, [updateActiveList]);

  const reorderTasks = useCallback((draggedId: string, targetId: string) => {
    updateActiveList(list => {
      const result = [...list.tasks];
      const draggedIndex = result.findIndex(t => t.id === draggedId);
      const targetIndex = result.findIndex(t => t.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) return list;
      const [removed] = result.splice(draggedIndex, 1);
      result.splice(targetIndex, 0, removed);
      return { ...list, tasks: result };
    });
  }, [updateActiveList]);

  const resetChecks = useCallback(() => {
    updateActiveList(list => ({
      ...list,
      tasks: list.tasks.map(t => ({ ...t, completed: false }))
    }));
  }, [updateActiveList]);

  const createNewList = async () => {
  const newList: Checklist = {
    id: Math.random().toString(36).substr(2, 9),
    name: `New List ${checklists.length + 1}`,
    tasks: []
  };

  const updatedLists = [...checklists, newList];

  setChecklists(updatedLists);
  setActiveListId(newList.id);
  setIsDropdownOpen(false);
  setIsRenaming(true);

  if (user) {
    await saveUserChecklists(user.uid, updatedLists);
  }
};



  const deleteList = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (checklists.length <= 1) {
      alert("You must have at least one checklist.");
      return;
    }
    const listToDelete = checklists.find(l => l.id === id);
    if (confirm(`Delete the list "${listToDelete?.name}"? All items will be lost.`)) {
      const remaining = checklists.filter(l => l.id !== id);
      setChecklists(remaining);
      if (activeListId === id) {
        setActiveListId(remaining[0].id);
      }
    }
  };

  const handleRenameList = (newName: string) => {
    setChecklists(prev => prev.map(l => l.id === activeList.id ? { ...l, name: newName } : l));
  };

  const performExport = (id?: string) => {
    const all = !id;
    const data = all ? checklists : checklists.find(l => l.id === id);
    if (!data) return;

    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const filename = all ? 'checklist_backup_all.json' : `${(data as Checklist).name.replace(/\s+/g, '_')}_checklist.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', filename);
    linkElement.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        
        if (Array.isArray(imported)) {
          if (confirm(`Import ${imported.length} lists from backup?`)) {
            const merged = [...checklists];
            imported.forEach((list: Checklist) => {
              if (list.name && Array.isArray(list.tasks)) {
                list.id = Math.random().toString(36).substr(2, 9);
                merged.push(list);
              }
            });
            setChecklists(merged);
            alert("Backup imported successfully.");
          }
        } else if (imported.name && Array.isArray(imported.tasks)) {
          imported.id = Math.random().toString(36).substr(2, 9);
          setChecklists(prev => [...prev, imported]);
          setActiveListId(imported.id);
          alert(`Imported "${imported.name}" successfully.`);
        } else {
          throw new Error("Invalid format");
        }
      } catch (err) {
        alert("Failed to import. Please ensure the file is a valid JSON exported from this app.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Auto-resize the new entry textarea
  useEffect(() => {
    if (newEntryTextareaRef.current) {
      newEntryTextareaRef.current.style.height = 'auto';
      newEntryTextareaRef.current.style.height = newEntryTextareaRef.current.scrollHeight + 'px';
    }
  }, [newEntryValue]);

  if (loadingAuth) {
  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-slate-400 text-sm">Loading...</p>
    </div>
  );
}

if (!user) {
  return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-800">Checkmaster</h1>
        {/* <p className="text-sm text-slate-500">
          Sign in with your work account to continue
        </p> */}
        <button
          onClick={async () => {
            setAuthError(null);
            try {
              await loginWithGoogle();
            } catch (error: any) {
              if (error.message === "INVALID_DOMAIN") {
                setAuthError("Invalid email address. Please use your work email (@q4inc.com)");
              } else {
                setAuthError("Can't log in. Try again.");
              }
            }
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
          Sign in with your Q4 account
        </button>
        {authError && (
          <p className="text-sm text-red-500 font-medium">
            {authError}
          </p>
        )}
      </div>
    </div>
  );
};
  return (
    <div className="flex flex-col h-screen w-screen bg-white overflow-hidden selection:bg-blue-100 relative">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportFile} 
        className="hidden" 
        accept=".json"
      />

      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white z-50">
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          {isRenaming ? (
            <input
              autoFocus
              className="text-xl font-bold text-slate-800 bg-transparent border-b-2 border-blue-500 outline-none w-48"
              value={activeList.name}
              onChange={(e) => handleRenameList(e.target.value)}
              onBlur={() => setIsRenaming(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsRenaming(false)}
            />
          ) : (
            <div className="flex items-center gap-2 group">
              <h1 
                className="text-xl font-bold text-slate-800 truncate max-w-[140px] md:max-w-md cursor-pointer decoration-blue-200 decoration-2 underline-offset-4 hover:underline"
                onClick={() => setIsRenaming(true)}
              >
                {activeList.name}
              </h1>
              <button 
                onClick={() => setIsRenaming(true)}
                className="p-1 text-slate-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Rename List"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}

          <button 
            className={`p-2 rounded-lg transition-all duration-200 ${isDropdownOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <svg className={`w-5 h-5 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* List Selector Dropdown */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                Your Lists
              </div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {checklists.map(list => (
                  <div 
                    key={list.id}
                    onClick={() => { setActiveListId(list.id); setIsDropdownOpen(false); }}
                    className={`group/item flex items-center justify-between px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm transition-colors ${list.id === activeListId ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-600'}`}
                  >
                    <span className="truncate pr-4">{list.name}</span>
                    <div className="flex items-center gap-2">
                      {checklists.length > 1 && (
                        <button 
                          onClick={(e) => deleteList(list.id, e)}
                          className="opacity-0 group-hover/item:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 rounded-md hover:bg-rose-50 transition-all"
                          title="Delete List"
                        >
                          <ICONS.Trash className="w-4 h-4" />
                        </button>
                      )}
                      {list.id === activeListId && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-slate-100 mt-1 pt-1">
                <button 
                  onClick={createNewList}
                  className="w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-3 font-medium transition-colors"
                >
                  <ICONS.Plus className="w-4 h-4" />
                  New Checklist
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
            title="Settings (Import/Export)">
            <ICONS.Cog className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-slate-100 mx-1"></div>

          {/* User info + Logout */}
          <span className="text-xs text-slate-400 mr-2">
          {user?.email}
          </span>

           <button
              onClick={logout}
              className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              title="Logout">
              Logout
           </button>

          <div className="w-px h-6 bg-slate-100 mx-1"></div>

          <button
            onClick={resetChecks}
            className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
            title="Reset checks">
            <ICONS.ArrowPath className="w-5 h-5" />
          </button>
        </div>

      </header>

      {/* Checklist Main Area */}
      <main className="flex-1 overflow-y-auto task-list bg-white">
        <div className="max-w-4xl mx-auto w-full px-4 md:px-0">
          <div className="divide-y divide-slate-50 py-4">
            {activeList.tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onUpdateText={updateTaskText}
                onReorder={reorderTasks}
              />
            ))}

            {/* Dynamic New Entry Placeholder */}
            <div className="flex items-start py-4 px-4 hover:bg-slate-50/50 transition-all duration-200">
              <div className="pt-1.5 pr-2 text-slate-100">
                <ICONS.Plus className="w-4 h-4" />
              </div>
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div className="flex items-center pt-1">
                  <div className="h-5 w-5 rounded-md border-2 border-slate-200 bg-slate-50 opacity-50"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <textarea
                    ref={newEntryTextareaRef}
                    rows={1}
                    value={newEntryValue}
                    onChange={(e) => setNewEntryValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTask();
                      }
                    }}
                    onBlur={() => {
                      if (newEntryValue.trim()) addTask();
                    }}
                    className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-sm transition-all p-0 m-0 resize-none overflow-hidden block font-medium text-slate-400 placeholder:text-slate-300"
                    placeholder="Add a task..."
                  />
                </div>
              </div>
            </div>
          </div>
          
          {activeList.tasks.length === 0 && !newEntryValue && (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
              <p className="text-slate-400 text-xs font-medium">Click above to start your list</p>
            </div>
          )}
        </div>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsSettingsOpen(false)}>
          <div 
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Settings</h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Import Section */}
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Import Data</h3>
                <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
                  <p className="text-xs text-blue-700 mb-4 leading-relaxed">
                    Import a JSON file to restore lists or full backups.
                  </p>
                  <button 
                    onClick={() => { fileInputRef.current?.click(); setIsSettingsOpen(false); }}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-blue-200 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-all active:scale-[0.98]"
                  >
                    <ICONS.Import className="w-4 h-4" />
                    Select JSON File
                  </button>
                </div>
              </section>

              {/* Export Section */}
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Export Data</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide">Single List Export</label>
                    <div className="flex gap-2">
                      <select 
                        value={selectedExportId}
                        onChange={(e) => setSelectedExportId(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        {checklists.map(l => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => performExport(selectedExportId)}
                        className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-black transition-all"
                      >
                        Export
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => performExport()}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
                  >
                    <ICONS.Export className="w-4 h-4" />
                    Export All Lists (Backup)
                  </button>
                </div>
              </section>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-medium">Your data is stored privately on this device.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
