import React, { useState, useEffect, useMemo } from 'react';
import constitutionData from './constitution.json';
import { db, Note } from './db';
import FlexSearch from 'flexsearch';
import { Search, Bookmark as BookmarkIcon, Edit3, Copy, Trash2, Save, X, Settings as SettingsIcon, Sun, Moon, Type } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

type BlockType = 'preamble' | 'article' | 'amendment';
type Theme = 'light' | 'dark' | 'system';
type FontSize = 'sm' | 'base' | 'lg' | 'xl' | '2xl';

interface Settings {
  theme: Theme;
  fontSize: FontSize;
}

const fontSizeClasses: Record<FontSize, string> = {
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl'
};

interface ContentBlock {
  id: string;
  type: BlockType;
  label: string;      // e.g. "Article I"
  subLabel?: string;  // e.g. "Legislative Branch"
  content: string;
  sectionNumber?: number; // For display "Section 1"
  searchTerms?: string;   // Additional searchable terms (e.g. "25" for 25th amendment)
  [key: string]: any; // Allow index signature for FlexSearch compatibility
}

// --- Data Transformation ---

const processData = (): ContentBlock[] => {
  const blocks: ContentBlock[] = [];
  const { constitution } = constitutionData;

  // Preamble
  blocks.push({
    id: 'preamble',
    type: 'preamble',
    label: 'Preamble',
    content: constitution.preamble.text
  });

  // Articles
  constitution.articles.forEach((article) => {
    // Some articles might have direct text, some have sections.
    if (article.sections) {
      article.sections.forEach((section) => {
        blocks.push({
          id: `article-${article.number}-section-${section.number}`,
          type: 'article',
          label: `Article ${article.number}`,
          subLabel: article.title,
          content: section.text,
          sectionNumber: section.number,
          searchTerms: `${article.number} article ${article.number} section ${section.number}`
        });
      });
    } else if (article.text) {
      blocks.push({
        id: `article-${article.number}`,
        type: 'article',
        label: `Article ${article.number}`,
        subLabel: article.title,
        content: article.text,
        searchTerms: `${article.number} article ${article.number}`
      });
    }
  });

  // Amendments
  constitution.amendments.forEach((amendment) => {
    if (amendment.sections) {
      amendment.sections.forEach((section) => {
        blocks.push({
          id: `amendment-${amendment.number}-section-${section.number}`,
          type: 'amendment',
          label: `${amendment.title}`,
          subLabel: amendment.description,
          content: section.text,
          sectionNumber: section.number,
          searchTerms: `${amendment.number} amendment ${amendment.number} section ${section.number}`
        });
      });
    } else if (amendment.text) {
      blocks.push({
        id: `amendment-${amendment.number}`,
        type: 'amendment',
        label: `${amendment.title}`,
        subLabel: amendment.description,
        content: amendment.text,
        searchTerms: `${amendment.number} amendment ${amendment.number}`
      });
    }
  });

  return blocks;
};

// --- Components ---

interface BlockProps {
  block: ContentBlock;
  isBookmarked: boolean;
  note?: Note;
  fontSize: FontSize;
  onToggleBookmark: (id: string) => void;
  onSaveNote: (id: string, content: string) => void;
  onDeleteNote: (id: string) => void;
}

const BlockView: React.FC<BlockProps> = ({ block, isBookmarked, note, fontSize, onToggleBookmark, onSaveNote, onDeleteNote }) => {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState(note?.content || '');

  // Reset note content if note prop changes (e.g. from DB load)
  useEffect(() => {
    if (note) {
      setNoteContent(note.content);
    } else {
      setNoteContent('');
    }
  }, [note]);

  const handleCopy = () => {
    navigator.clipboard.writeText(block.content);
    // Could add toast here
  };

  const handleSave = () => {
    onSaveNote(block.id, noteContent);
    setIsEditingNote(false);
  };

  return (
    <div id={block.id} className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 mb-6 border border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md scroll-mt-36">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
            {block.label} {block.sectionNumber ? `• Section ${block.sectionNumber}` : ''}
          </h3>
          {block.subLabel && (
            <h4 className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">
              {block.subLabel}
            </h4>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onToggleBookmark(block.id)}
            className={cn(
              "p-2 rounded-full transition-colors",
              isBookmarked 
                ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" 
                : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
            title="Bookmark"
          >
            <BookmarkIcon size={18} fill={isBookmarked ? "currentColor" : "none"} />
          </button>
          <button
            onClick={handleCopy}
            className="p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            title="Copy Text"
          >
            <Copy size={18} />
          </button>
        </div>
      </div>

      <p className={cn("text-zinc-800 dark:text-zinc-200 leading-relaxed font-serif", fontSizeClasses[fontSize])}>
        {block.content}
      </p>

      {/* Note Section */}
      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        {!isEditingNote && !note && (
          <button
            onClick={() => setIsEditingNote(true)}
            className="flex items-center text-sm text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors"
          >
            <Edit3 size={14} className="mr-2" /> Add Note
          </button>
        )}

        {(isEditingNote || note) && (
          <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-md border border-yellow-100 dark:border-yellow-900/30">
            {isEditingNote ? (
              <div className="space-y-2">
                <textarea
                  className="w-full p-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-zinc-200"
                  rows={3}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Enter your thoughts..."
                  autoFocus
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setIsEditingNote(false)}
                    className="p-1 px-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center p-1 px-3 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Save size={12} className="mr-1" /> Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                 <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-sans">
                   <span className="font-bold text-xs uppercase text-zinc-400 block mb-1">Your Note</span>
                   {note?.content}
                 </p>
                 <div className="flex flex-col space-y-1 ml-2">
                   <button 
                    onClick={() => setIsEditingNote(true)}
                    className="p-1 text-zinc-400 hover:text-blue-500"
                   >
                     <Edit3 size={14} />
                   </button>
                   <button 
                    onClick={() => onDeleteNote(block.id)}
                    className="p-1 text-zinc-400 hover:text-red-500"
                   >
                     <Trash2 size={14} />
                   </button>
                 </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

function App() {
  const [query, setQuery] = useState('');
  const [allBlocks, setAllBlocks] = useState<ContentBlock[]>([]);
  const [filteredBlocks, setFilteredBlocks] = useState<ContentBlock[]>([]);
  const [notes, setNotes] = useState<Record<string, Note>>({});
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'reader' | 'bookmarks'>('reader');
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings State with localStorage persistence
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('constitution-settings');
    return saved ? JSON.parse(saved) : { theme: 'system', fontSize: 'lg' };
  });

  // Apply Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = 
      settings.theme === 'dark' || 
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    localStorage.setItem('constitution-settings', JSON.stringify(settings));
  }, [settings]);

  // Navigation
  const navigationItems = useMemo(() => {
    const items = new Map<string, string>(); // label -> id of first occurrence
    allBlocks.forEach(block => {
      if (!items.has(block.label)) {
        items.set(block.label, block.id);
      }
    });
    return Array.from(items.entries()).map(([label, id]) => ({ label, id }));
  }, [allBlocks]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Initialize Search Index
  // @ts-ignore - FlexSearch types are tricky
  const searchIndex = useMemo(() => new FlexSearch.Document({
    document: {
      id: "id",
      index: ["content", "label", "subLabel", "searchTerms"],
    },
    tokenize: "forward"
  }), []);

  // Load Data and Initialize Search
  useEffect(() => {
    const blocks = processData();
    setAllBlocks(blocks);
    setFilteredBlocks(blocks);

    blocks.forEach(block => {
      searchIndex.add(block);
    });

    // Load User Data
    const loadUserData = async () => {
      const storedNotes = await db.notes.toArray();
      const storedBookmarks = await db.bookmarks.toArray();
      
      const notesMap: Record<string, Note> = {};
      storedNotes.forEach(n => notesMap[n.id] = n);
      setNotes(notesMap);

      setBookmarks(new Set(storedBookmarks.map(b => b.id)));
    };
    loadUserData();
  }, [searchIndex]);

  // Handle Search
  useEffect(() => {
    if (!query.trim()) {
      setFilteredBlocks(allBlocks);
      return;
    }

    const results = searchIndex.search(query, { limit: 100 });
    // results structure from Document search: [{ field: 'content', result: [id1, id2] }, ...]
    // We need to merge all IDs
    
    const matchedIds = new Set<string>();
    results.forEach((fieldResult: any) => {
      fieldResult.result.forEach((id: string) => matchedIds.add(id));
    });

    setFilteredBlocks(allBlocks.filter(b => matchedIds.has(b.id)));
  }, [query, allBlocks, searchIndex]);

  // Actions
  const toggleBookmark = async (id: string) => {
    if (bookmarks.has(id)) {
      await db.bookmarks.delete(id);
      const newBookmarks = new Set(bookmarks);
      newBookmarks.delete(id);
      setBookmarks(newBookmarks);
    } else {
      await db.bookmarks.put({ id, createdAt: Date.now() });
      setBookmarks(new Set(bookmarks).add(id));
    }
  };

  const saveNote = async (id: string, content: string) => {
    const note: Note = { id, content, updatedAt: Date.now() };
    await db.notes.put(note);
    setNotes(prev => ({ ...prev, [id]: note }));
  };

  const deleteNote = async (id: string) => {
    await db.notes.delete(id);
    const newNotes = { ...notes };
    delete newNotes[id];
    setNotes(newNotes);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 transition-colors">
      
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-black tracking-tight flex items-center">
              <span className="text-blue-600 mr-2">🇺🇸</span> Constitution
            </h1>
            <div className="flex gap-2">
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('reader')}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded-md transition-all",
                    activeTab === 'reader' 
                      ? "bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400" 
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  READER
                </button>
                <button
                  onClick={() => setActiveTab('bookmarks')}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center",
                    activeTab === 'bookmarks' 
                      ? "bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400" 
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  BOOKMARKS
                  {bookmarks.size > 0 && (
                    <span className="ml-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full text-[10px]">
                      {bookmarks.size}
                    </span>
                  )}
                </button>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors"
                title="Settings"
              >
                <SettingsIcon size={20} />
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-blue-500 transition-colors">
              <Search size={20} />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-10 py-3 border-none rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              placeholder={activeTab === 'reader' ? "Search articles, amendments, text..." : "Search your bookmarks..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick Nav Chips */}
          {activeTab === 'reader' && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {navigationItems.map(({ label, id }) => (
                <button
                  key={label}
                  onClick={() => scrollToSection(id)}
                  className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 transition-colors border border-zinc-200 dark:border-zinc-700"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {activeTab === 'bookmarks' && bookmarks.size === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <div className="bg-zinc-100 dark:bg-zinc-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookmarkIcon size={24} className="text-zinc-300" />
            </div>
            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">No bookmarks yet</p>
            <p className="text-sm mt-1 text-zinc-500">Sections you bookmark will appear here for easy access.</p>
            <button 
              onClick={() => setActiveTab('reader')}
              className="mt-6 text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline"
            >
              Back to Reader
            </button>
          </div>
        ) : filteredBlocks.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-lg">No results found for "{query}"</p>
          </div>
        ) : (
          (activeTab === 'bookmarks' 
            ? filteredBlocks.filter(b => bookmarks.has(b.id)) 
            : filteredBlocks
          ).map(block => (
            <BlockView
              key={block.id}
              block={block}
              isBookmarked={bookmarks.has(block.id)}
              note={notes[block.id]}
              fontSize={settings.fontSize}
              onToggleBookmark={toggleBookmark}
              onSaveNote={saveNote}
              onDeleteNote={deleteNote}
            />
          ))
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-sm p-6 border border-zinc-200 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Theme */}
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 block">Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'dark', 'system'] as Theme[]).map(theme => (
                    <button
                      key={theme}
                      onClick={() => setSettings(s => ({ ...s, theme }))}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all",
                        settings.theme === theme
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-500"
                          : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      )}
                    >
                      {theme === 'light' && <Sun size={18} className="mb-1" />}
                      {theme === 'dark' && <Moon size={18} className="mb-1" />}
                      {theme === 'system' && <SettingsIcon size={18} className="mb-1" />}
                      <span className="capitalize">{theme}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 block">Font Size</label>
                <div className="grid grid-cols-5 gap-2">
                  {(['sm', 'base', 'lg', 'xl', '2xl'] as FontSize[]).map(size => (
                    <button
                      key={size}
                      onClick={() => setSettings(s => ({ ...s, fontSize: size }))}
                      className={cn(
                        "flex items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all",
                        settings.fontSize === size
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-500"
                          : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      )}
                    >
                      {size === 'sm' && <Type size={12} />}
                      {size === 'base' && <Type size={14} />}
                      {size === 'lg' && <Type size={16} />}
                      {size === 'xl' && <Type size={20} />}
                      {size === '2xl' && <Type size={24} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
