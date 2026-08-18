import React, { useState, useEffect, useMemo } from 'react';
import { RegexRule, RegexPreset, CleanResult } from './types';
import { DEFAULT_PRESETS } from './presets';
import logo from './Logo.png';
import { cleanText } from './utils/cleaner';
import PatternManager from './components/PatternManager';
import AIRegexGenerator from './components/AIRegexGenerator';
import HighlightedTextarea from './components/HighlightedTextarea';
import UserAuth from './components/UserAuth';
import { useFirebaseTemplates, UserTemplate } from './lib/useFirebaseTemplates';
import { User } from 'firebase/auth';
import { 
  FileText, 
  Copy, 
  Check, 
  Trash2, 
  Download, 
  Sparkles, 
  Clock, 
  SlidersHorizontal, 
  RefreshCw, 
  Scissors, 
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Info,
  AlertCircle,
  Loader2,
  X,
  Bookmark,
  LogIn,
  UserPlus
} from 'lucide-react';

export default function App() {
  // --- States ---
  const [inputText, setInputText] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('regex_cleaner_input');
      return saved !== null ? saved : '';
    } catch {
      return '';
    }
  });

  const [rules, setRules] = useState<RegexRule[]>(() => {
    try {
      const saved = localStorage.getItem('regex_cleaner_rules');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Failed to parse saved rules:', err);
    }
    return [];
  });

  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('regex_cleaner_preset_id');
    } catch {
      return null;
    }
  });

  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [inputCopySuccess, setInputCopySuccess] = useState<boolean>(false);

  // --- Firebase States & Templates hook ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authTrigger, setAuthTrigger] = useState<{ mode: 'signin' | 'signup'; id: number } | null>(null);
  const { 
    templates, 
    loading: templatesLoading, 
    saveTemplate, 
    deleteTemplate 
  } = useFirebaseTemplates(currentUser);
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // --- Horizontal Carousel Scroll States & Refs ---
  const builtinScrollRef = React.useRef<HTMLDivElement>(null);
  const customScrollRef = React.useRef<HTMLDivElement>(null);
  const [builtinCanScrollLeft, setBuiltinCanScrollLeft] = useState(false);
  const [builtinCanScrollRight, setBuiltinCanScrollRight] = useState(false);
  const [customCanScrollLeft, setCustomCanScrollLeft] = useState(false);
  const [customCanScrollRight, setCustomCanScrollRight] = useState(false);

  const [hoveredItemInfo, setHoveredItemInfo] = useState<{
    name: string;
    description: string;
    rules: RegexRule[];
    rect: DOMRect;
  } | null>(null);

  const checkScrollState = React.useCallback((
    el: HTMLDivElement | null, 
    setLeft: (v: boolean) => void, 
    setRight: (v: boolean) => void
  ) => {
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setLeft(scrollLeft > 3);
    setRight(scrollLeft + clientWidth < scrollWidth - 3);
  }, []);

  const updateAllScrollStates = React.useCallback(() => {
    checkScrollState(builtinScrollRef.current, setBuiltinCanScrollLeft, setBuiltinCanScrollRight);
    checkScrollState(customScrollRef.current, setCustomCanScrollLeft, setCustomCanScrollRight);
  }, [checkScrollState]);

  useEffect(() => {
    // Initial check and on updates
    const timer = setTimeout(updateAllScrollStates, 100);
    window.addEventListener('resize', updateAllScrollStates);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateAllScrollStates);
    };
  }, [updateAllScrollStates, templates]);

  const handleScroll = (direction: 'left' | 'right', ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Save template modal states
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Auth prompt state
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);

  // Trigger Auth Modal externally from save button
  const [authTriggerKey, setAuthTriggerKey] = useState(0);

  // --- Sync to Local Storage ---
  useEffect(() => {
    try {
      localStorage.setItem('regex_cleaner_input', inputText);
    } catch (err) {
      console.warn('localStorage write failed:', err);
    }
  }, [inputText]);

  useEffect(() => {
    try {
      localStorage.setItem('regex_cleaner_rules', JSON.stringify(rules));
    } catch (err) {
      console.warn('localStorage write failed:', err);
    }
  }, [rules]);

  useEffect(() => {
    try {
      if (selectedPresetId) {
        localStorage.setItem('regex_cleaner_preset_id', selectedPresetId);
      } else {
        localStorage.removeItem('regex_cleaner_preset_id');
      }
    } catch (err) {
      console.warn('localStorage access failed:', err);
    }
  }, [selectedPresetId]);

  // --- Compute Cleaning ---
  const cleanResult = useMemo<CleanResult>(() => {
    return cleanText(inputText, rules);
  }, [inputText, rules]);

  // --- Actions ---
  const loadPreset = (preset: RegexPreset) => {
    if (selectedPresetId === preset.id) {
      setRules([]);
      setInputText('');
      setSelectedPresetId(null);
    } else {
      setRules(preset.rules);
      setInputText(preset.sampleText);
      setSelectedPresetId(preset.id);
      setSelectedTemplateId(null);
    }
  };

  const loadTemplate = (template: UserTemplate) => {
    if (selectedTemplateId === template.id) {
      setRules([]);
      setInputText('');
      setSelectedTemplateId(null);
    } else {
      setRules(template.rules);
      setInputText(template.sampleText);
      setSelectedTemplateId(template.id);
      setSelectedPresetId(null);
    }
  };

  const handleCustomRuleChange = (newRules: RegexRule[]) => {
    setRules(newRules);
    // If rules are customized, deselect current preset highlight
    setSelectedPresetId(null);
    setSelectedTemplateId(null);
  };

  const handleSaveTemplateClick = () => {
    if (!currentUser) {
      setIsAuthPromptOpen(true);
      return;
    }
    setTemplateName('');
    setTemplateDesc('');
    setSaveError(null);
    setIsSaveModalOpen(true);
  };

  const handleSaveTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      setSaveError('Please enter a rule set name.');
      return;
    }

    setSaveLoading(true);
    setSaveError(null);

    try {
      const savedId = await saveTemplate(
        templateName.trim(),
        templateDesc.trim(),
        rules,
        inputText
      );
      if (savedId) {
        setSelectedPresetId(savedId);
      }
      setIsSaveModalOpen(false);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save rule set.');
    } finally {
      setSaveLoading(false);
    }
  };


  const copyToClipboard = async (text: string, isInput: boolean) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isInput) {
        setInputCopySuccess(true);
        setTimeout(() => setInputCopySuccess(false), 1500);
      } else {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 1500);
      }
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const downloadTextFile = () => {
    try {
      const element = document.createElement('a');
      const file = new Blob([cleanResult.cleanedText], { type: 'text/plain;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      element.download = 'cleaned_text.txt';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      console.error('Failed to download file:', err);
    }
  };

  const clearInput = () => {
    setInputText('');
  };

  // Calculate percentage reduction
  const reductionPercentage = useMemo(() => {
    if (cleanResult.originalCharCount === 0) return 0;
    const reduced = cleanResult.originalCharCount - cleanResult.cleanedCharCount;
    return Math.max(0, Math.round((reduced / cleanResult.originalCharCount) * 100));
  }, [cleanResult]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-300 flex flex-col font-sans antialiased selection:bg-indigo-500/30 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="min-h-16 h-16 sm:h-20 border-b border-slate-800 flex items-center justify-between py-2 px-3 sm:px-6 bg-[#1E293B] sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-2.5">
          <img 
            src={logo} 
            alt="Scrubadub Logo" 
            className="w-28 sm:w-36 md:w-42 h-10 sm:h-14 md:h-16 object-contain" 
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 text-[11px] font-medium text-slate-400 shrink-0">
          <UserAuth 
            onUserChange={setCurrentUser} 
            openAuthTrigger={authTrigger}
            onCloseAuthTrigger={() => setAuthTrigger(null)}
          />
             
          <div className="hidden sm:block h-8 w-px bg-slate-700"></div>

          <div className="hidden sm:flex flex-col items-start gap-1">
            <a 
              href="https://github.com/MrTWrecks0208/MrTWrecks0208.github.io/blob/ee6d9bdf3d9428e6a3f856c156df50cdd9116c25/Scrubadub-Documentation.md" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors shrink-0"
            >
              <span>View Documentation</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
            <a 
              href="https://regex101.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors shrink-0"
            >
              <span>Regex Cheat Sheet</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="flex-1 max-w-[1450px] w-full mx-auto px-2 sm:px-4 pt-3 pb-1 sm:pb-1.5 space-y-3">
        
        {/* Presets Bento Strip */}
        <section className="bg-[#1E293B]/40 border border-slate-800 rounded-lg p-2 px-3">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Rule Sets</h2>
            </div>
          </div>

          <div className="space-y-2">
            {/* Built-in Rule Sets */}
            <div>
              <div className="flex items-center justify-between mb-1 font-mono">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Built-in</div>
                {(builtinCanScrollLeft || builtinCanScrollRight) && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleScroll('left', builtinScrollRef)}
                      disabled={!builtinCanScrollLeft}
                      className={`p-0.5 rounded border transition-colors ${
                        builtinCanScrollLeft
                          ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer'
                          : 'border-slate-800/40 bg-slate-900/40 text-slate-700 cursor-not-allowed opacity-40'
                      }`}
                      title="Scroll left"
                    >
                      <ChevronLeft className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScroll('right', builtinScrollRef)}
                      disabled={!builtinCanScrollRight}
                      className={`p-0.5 rounded border transition-colors ${
                        builtinCanScrollRight
                          ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer'
                          : 'border-slate-800/40 bg-slate-900/40 text-slate-700 cursor-not-allowed opacity-40'
                      }`}
                      title="Scroll right"
                    >
                      <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>

              <div 
                ref={builtinScrollRef}
                onScroll={() => checkScrollState(builtinScrollRef.current, setBuiltinCanScrollLeft, setBuiltinCanScrollRight)}
                className="flex gap-1.5 overflow-x-auto scrollbar-none scroll-smooth py-0.5"
              >
                {DEFAULT_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => loadPreset(preset)}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredItemInfo({
                          name: preset.name,
                          description: preset.description,
                          rules: preset.rules,
                          rect
                        });
                      }}
                      onMouseLeave={() => setHoveredItemInfo(null)}
                      className={`flex flex-col justify-between text-left p-1.5 px-2.5 rounded border transition-all duration-150 group relative cursor-pointer min-w-[150px] max-w-[190px] flex-1 flex-shrink-0 ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-xs'
                          : 'border-slate-800 bg-[#1E293B]/25 text-slate-400 hover:border-slate-700 hover:bg-[#1E293B]/50'
                      }`}
                    >
                      <h3 className={`text-[11px] font-semibold truncate w-full ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                        {preset.name}
                      </h3>
                      <div className="mt-1 flex items-center justify-between w-full text-[9px] font-mono">
                        <span className={`px-1 rounded-xs uppercase tracking-wider text-[8.5px] ${
                          isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800/80 text-slate-500'
                        }`}>
                          {preset.rules.length} rule{preset.rules.length !== 1 && 's'}
                        </span>
                        <span className={`flex items-center gap-0.5 text-[8.5px] ${
                          isSelected ? 'text-indigo-400 font-semibold' : 'text-slate-550 group-hover:text-slate-300 transition-colors'
                        }`}>
                          {isSelected ? 'Active' : 'Load'} <ChevronRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Rule Sets */}
            <div className="pt-1.5 border-t border-slate-800/40">
              <div className="flex items-center justify-between mb-1 font-mono">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <span>Custom</span>
                  {templatesLoading && <Loader2 className="w-2.5 h-2.5 animate-spin text-indigo-400" />}
                  {templates.length > 0 && <span className="text-slate-600 font-normal">({templates.length})</span>}
                </div>
                {templates.length > 0 && (customCanScrollLeft || customCanScrollRight) && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleScroll('left', customScrollRef)}
                      disabled={!customCanScrollLeft}
                      className={`p-0.5 rounded border transition-colors ${
                        customCanScrollLeft
                          ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer'
                          : 'border-slate-800/40 bg-slate-900/40 text-slate-700 cursor-not-allowed opacity-40'
                      }`}
                      title="Scroll left"
                    >
                      <ChevronLeft className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScroll('right', customScrollRef)}
                      disabled={!customCanScrollRight}
                      className={`p-0.5 rounded border transition-colors ${
                        customCanScrollRight
                          ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer'
                          : 'border-slate-800/40 bg-slate-900/40 text-slate-700 cursor-not-allowed opacity-40'
                      }`}
                      title="Scroll right"
                    >
                      <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
              
              {templates.length === 0 ? (
                templatesLoading ? (
                  <div className="p-2.5 rounded-lg border border-dashed border-slate-800/80 bg-[#1E293B]/20 flex items-center justify-center gap-2 text-slate-400 text-xs font-mono">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span>Loading saved rule sets...</span>
                  </div>
                ) : currentUser ? (
                  <div className="p-2.5 px-3.5 rounded-lg border border-dashed border-slate-800/80 bg-[#1E293B]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                      No custom rule sets found. To create custom rule sets, create rules below and click <strong className="text-white font-semibold">"Save Rule Set"</strong> when finished.
                    </p>
                    <div className="flex items-center gap-1.5 text-[9.5px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-0.5 rounded-full flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Syncing to @{currentUser.displayName || currentUser.email?.split('@')[0] || 'account'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 px-3.5 rounded-lg border border-slate-800 bg-gradient-to-r from-slate-900/90 via-[#1E293B]/30 to-slate-900/90 space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                      <div className="space-y-1">
                        <p className="text-[11px] text-slate-300 leading-snug font-normal">
                          No custom rule sets found. To create custom rule sets, create rules below and click <strong className="text-white font-semibold">"Save Rule Set"</strong> when finished.
                        </p>
                        <div className="flex items-center gap-1.5 text-[10.5px] text-amber-300/95 bg-amber-950/30 border border-amber-900/40 px-2 py-0.5 rounded-md w-fit">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                          <span>
                            <strong className="text-amber-200 uppercase tracking-wider text-[9px] font-bold">Note:</strong> An account is required to save custom rule sets.
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 self-end md:self-center">
                        <button
                          type="button"
                          onClick={() => setAuthTrigger({ mode: 'signin', id: Date.now() })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                        >
                          <LogIn className="w-3 h-3" />
                          <span>Sign In</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuthTrigger({ mode: 'signup', id: Date.now() })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white border border-slate-700 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Create Account</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div 
                  ref={customScrollRef}
                  onScroll={() => checkScrollState(customScrollRef.current, setCustomCanScrollLeft, setCustomCanScrollRight)}
                  className="flex gap-1.5 overflow-x-auto scrollbar-none scroll-smooth py-0.5"
                >
                  {templates.map((template) => {
                    const isSelected = selectedTemplateId === template.id;
                    return (
                      <div
                        key={template.id}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredItemInfo({
                            name: template.name,
                            description: template.description || 'No description provided.',
                            rules: template.rules,
                            rect
                          });
                        }}
                        onMouseLeave={() => setHoveredItemInfo(null)}
                        className={`flex flex-col justify-between text-left p-1.5 px-2.5 rounded border transition-all duration-150 group relative cursor-pointer min-w-[150px] max-w-[190px] flex-1 flex-shrink-0 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-xs'
                            : 'border-slate-800 bg-[#1E293B]/25 text-slate-400 hover:border-slate-700 hover:bg-[#1E293B]/50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => loadTemplate(template)}
                          className="flex-1 w-full flex flex-col items-start text-left cursor-pointer"
                        >
                          <h3 className={`text-[11px] font-semibold truncate pr-5 w-full ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                            {template.name}
                          </h3>
                          <div className="mt-1 flex items-center justify-between w-full text-[9px] font-mono">
                            <span className={`px-1 rounded-xs uppercase tracking-wider text-[8.5px] ${
                              isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800/80 text-slate-500'
                            }`}>
                              {template.rules.length} rule{template.rules.length !== 1 && 's'}
                            </span>
                            <span className={`flex items-center gap-0.5 text-[8.5px] ${
                              isSelected ? 'text-indigo-400 font-semibold' : 'text-slate-550 group-hover:text-slate-300 transition-colors'
                            }`}>
                              {isSelected ? 'Active' : 'Load'} <ChevronRight className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete rule set "${template.name}"?`)) {
                              deleteTemplate(template.id);
                              if (isSelected) {
                                setSelectedTemplateId(null);
                              }
                            }
                          }}
                          className="absolute top-1.5 right-1.5 p-0.5 rounded hover:bg-rose-950/30 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Delete Rule Set"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Workspace Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* Rules Block (Renders FIRST on mobile, SECOND column on desktop) */}
          <div className="lg:col-span-5 order-1 lg:order-2 space-y-4">
            <AIRegexGenerator 
              onAddRule={(newRule) => {
                setRules([...rules, newRule]);
                setSelectedPresetId(null);
                setSelectedTemplateId(null);
              }} 
              sampleText={inputText}
            />
            <PatternManager 
              rules={rules} 
              onChange={handleCustomRuleChange} 
              ruleStats={cleanResult.ruleStats} 
              onSaveTemplate={handleSaveTemplateClick}
            />
          </div>

          {/* Editor Panels: Source Input & Scrubbed Output (Renders SECOND on mobile, FIRST column on desktop) */}
          <div className="lg:col-span-7 order-2 lg:order-1 space-y-4">
            
            {/* Input Panel */}
            <div className="bg-[#1E293B]/20 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800 bg-[#1E293B]/60">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Source Text</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={clearInput}
                    disabled={!inputText}
                    title="Clear input"
                    className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-3 bg-[#020617]">
                <HighlightedTextarea
                  value={inputText}
                  onChange={setInputText}
                  placeholder="Paste text here..."
                  rules={rules}
                  ruleStats={cleanResult.ruleStats}
                />
                
                {/* Statistics Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-500">
                  <div className="flex items-center gap-3">
                    <span>Chars: <strong className="text-slate-400">{inputText.length.toLocaleString()}</strong></span>
                    <span>Words: <strong className="text-slate-400">{cleanResult.originalWordCount.toLocaleString()}</strong></span>
                  </div>
                  <div className="relative group/sample-btn">
                    <button
                      type="button"
                      onClick={() => {
                        const randomPreset = DEFAULT_PRESETS[Math.floor(Math.random() * DEFAULT_PRESETS.length)];
                        setInputText(randomPreset.sampleText);
                        setSelectedPresetId(null);
                      }}
                      className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 text-slate-300 hover:text-white border border-slate-700/80 hover:border-indigo-500/50 rounded text-[10px] font-sans font-semibold tracking-wide cursor-pointer transition-all shadow-xs"
                    >
                      <RefreshCw className="w-3 h-3 text-indigo-400 group-hover/sample-btn:rotate-180 transition-transform duration-300" />
                      <span>Generate Sample Data</span>
                    </button>

                    <div className="absolute bottom-full right-0 mb-1.5 w-64 p-2.5 bg-slate-900/95 border border-slate-700 text-slate-300 text-[11px] rounded-lg shadow-2xl opacity-0 scale-95 pointer-events-none group-hover/sample-btn:opacity-100 group-hover/sample-btn:scale-100 transition-all duration-150 z-50 normal-case font-sans leading-relaxed backdrop-blur-md">
                      <span className="font-bold text-white block text-[10px] uppercase tracking-wider mb-1">
                        Generate Sample Data
                      </span>
                      Loads realistic data from a random built-in rule set into the source box so you can immediately test your active regex rules without altering your rules.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Output / Resulting Box Card */}
            <div className="bg-[#1E293B]/20 border border-slate-800 rounded-lg overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800 bg-[#1E293B]/60">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Scrubbed Output</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(cleanResult.cleanedText, false)}
                    disabled={!cleanResult.cleanedText}
                    title="Copy scrubbed output"
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    {copySuccess ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-400">
                        <Check className="w-3 h-3" />
                        Copied
                      </span>
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={downloadTextFile}
                    disabled={!cleanResult.cleanedText}
                    title="Download scrubbed output"
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Output Content */}
              <div className="p-3 bg-[#020617]">
                <div className="space-y-3">
                  <textarea
                    value={cleanResult.cleanedText}
                    readOnly
                    placeholder="Scrubbed output will render here..."
                    className="w-full h-64 sm:h-80 font-mono text-xs text-slate-400 bg-transparent border-0 outline-none resize-y placeholder:text-slate-600 select-all"
                    spellCheck={false}
                  />

                  {/* Compact stats bar */}
                  <div className="grid grid-cols-4 gap-2 p-2 bg-[#1E293B]/30 rounded border border-slate-900 text-center">
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                        Final Chars
                      </div>
                      <div className="text-sm font-semibold text-rose-500 mt-0.5">
                        {cleanResult.cleanedCharCount.toLocaleString()}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                        Final Words
                      </div>
                      <div className="text-sm font-semibold text-amber-500 mt-0.5">
                        {cleanResult.cleanedWordCount.toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                        Matches Scrubbed
                      </div>
                      <div className="text-sm font-semibold text-cyan-500 mt-0.5">
                        {cleanResult.totalMatchesRemoved.toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                        Reduction
                      </div>
                      <div className={`text-sm font-semibold mt-0.5 ${reductionPercentage > 0 ? 'text-emerald-500' : 'text-slate-500'}`}>
                        -{reductionPercentage}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="min-h-11 py-3 px-4 sm:px-8 bg-indigo-600 text-white text-[11px] flex flex-wrap items-center justify-between font-mono mt-auto select-none gap-x-6 gap-y-2.5 shadow-inner">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-5">
          <span>MODE: SEQUENCE_REPLACE</span>
          <span className="opacity-60 hidden sm:inline">|</span>
          <span>BUFFER: {((inputText.length * 2) / 1024).toFixed(2)} KB</span>
          <span className="opacity-60 hidden sm:inline">|</span>
          <span className="text-emerald-300 font-bold">MATCHES FOUND: {cleanResult.totalMatchesRemoved}</span>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <span>UTF-8</span>
          <span className="opacity-60">|</span>
          <span>LINUX (LF)</span>
        </div>
      </footer>

      {/* Save Rule Set Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-[#1E293B] border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#131B2E]/60">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-indigo-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                  Save Custom Rule Set
                </span>
                {currentUser && (
                  <span className="text-[9.5px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-900/50 px-1.5 py-0.5 rounded">
                    @{currentUser.displayName || currentUser.email?.split('@')[0] || 'user'}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSaveTemplateSubmit} className="p-5 space-y-4">
              {saveError && (
                <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-[11px] text-rose-400 font-mono flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-none mt-0.5" />
                  <span className="leading-tight">{saveError}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Rule Set Name
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. My PII Scrub rules"
                    required
                    maxLength={40}
                    disabled={saveLoading}
                    className="w-full px-3 py-1.5 bg-[#020617] border border-slate-800 rounded-md text-xs font-mono text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={templateDesc}
                    onChange={(e) => setTemplateDesc(e.target.value)}
                    placeholder="What does this rule set cleanse?"
                    maxLength={120}
                    rows={2}
                    disabled={saveLoading}
                    className="w-full px-3 py-1.5 bg-[#020617] border border-slate-800 rounded-md text-xs font-mono text-slate-200 outline-none resize-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  disabled={saveLoading}
                  className="flex-1 h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="flex-1 h-8 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {saveLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auth Prompt Modal */}
      {isAuthPromptOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-[#1E293B] border border-slate-800 rounded-xl shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsAuthPromptOpen(false)}
              className="absolute top-3 right-3 p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-full bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center mx-auto text-indigo-400">
              <Bookmark className="w-6 h-6" />
            </div>
            
            <div className="space-y-1.5 text-center">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Account Required to Save Rule Sets</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                You must create an account in order to save custom rule sets.
              </p>
            </div>

            <div className="p-3 bg-amber-950/25 border border-amber-900/40 rounded-lg text-left text-[11px] text-amber-300/95 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                <strong className="text-amber-200 uppercase tracking-wider text-[9px] font-bold block mb-0.5"></strong>
                Creating a <strong>free</strong> account allows you to create, store, and organize custom rule sets and access them across all your devices.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAuthPromptOpen(false);
                  setAuthTrigger({ mode: 'signin', id: Date.now() });
                }}
                className="flex-1 h-8.5 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAuthPromptOpen(false);
                  setAuthTrigger({ mode: 'signup', id: Date.now() });
                }}
                className="flex-1 h-8.5 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Floating Rule Breakdown Tooltip */}
      {hoveredItemInfo && (
        <div 
          className="fixed w-80 bg-slate-900/95 border border-slate-750 rounded-xl p-4 shadow-2xl z-50 backdrop-blur-md pointer-events-none transition-opacity duration-150 ease-out text-left font-sans"
          style={{
            top: `${Math.min(window.innerHeight - 260, hoveredItemInfo.rect.bottom + 8)}px`,
            left: `${Math.max(12, Math.min(window.innerWidth - 332, hoveredItemInfo.rect.left + hoveredItemInfo.rect.width / 2 - 160))}px`
          }}
        >
          <div className="space-y-3 text-left">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">{hoveredItemInfo.name}</h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed whitespace-normal font-normal">
                {hoveredItemInfo.description || 'No description provided.'}
              </p>
            </div>
            
            <div className="border-t border-slate-800 pt-2">
              <h5 className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest mb-1.5">Rule Breakdown</h5>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {hoveredItemInfo.rules && hoveredItemInfo.rules.map((rule, rIdx) => (
                  <div key={rule.id || rIdx} className="bg-slate-950/60 p-2 rounded border border-slate-800/80 font-mono text-[10px]">
                    <div className="font-bold text-slate-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      {rule.name}
                    </div>
                    <div className="mt-1 text-slate-400 overflow-x-auto whitespace-pre scrollbar-none py-0.5">
                      <span className="text-slate-550">Find:</span> <code className="text-amber-400 bg-amber-950/20 px-1 py-0.5 rounded">{rule.pattern}</code>
                    </div>
                    <div className="mt-0.5 text-slate-400 overflow-x-auto whitespace-pre scrollbar-none py-0.5">
                      <span className="text-slate-550">Replace:</span> <code className="text-emerald-400 bg-emerald-950/20 px-1 py-0.5 rounded">{rule.replacement || '""'}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-[9px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-800/40 pt-1.5">
              <span>Total: {hoveredItemInfo.rules ? hoveredItemInfo.rules.length : 0} patterns</span>
              <span>Click to load ruleset</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
