import React, { useState, useEffect, useMemo } from 'react';
import { RegexRule, RegexPreset, CleanResult } from './types';
import { DEFAULT_PRESETS } from './presets';
import logo from './Logo.png';
import { cleanText } from './utils/cleaner';
import PatternManager from './components/PatternManager';
import InteractiveDiff from './components/InteractiveDiff';
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
  Info,
  AlertCircle,
  Loader2,
  X,
  Bookmark
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

  const [activeTab, setActiveTab] = useState<'cleaned' | 'visualizer'>('cleaned');
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
  const { 
    templates, 
    loading: templatesLoading, 
    saveTemplate, 
    deleteTemplate 
  } = useFirebaseTemplates(currentUser);
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

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
    } else {
      setTemplateName('');
      setTemplateDesc('');
      setSaveError(null);
      setIsSaveModalOpen(true);
    }
  };

  const handleSaveTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!templateName.trim()) {
      setSaveError('Please enter a rule set name.');
      return;
    }

    setSaveLoading(true);
    setSaveError(null);

    try {
      await saveTemplate(
        templateName.trim(),
        templateDesc.trim(),
        rules,
        inputText
      );
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
      <header className="h-20 border-b border-slate-800 flex items-center justify-between py-2 pl-6 pr-2 bg-[#1E293B] sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-2.5">
          <img 
            src={logo} 
            alt="Scrubadub Logo" 
            className="w-42 h-16 object-fill" 
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="flex items-center gap-4 text-[11px] pr-6 font-medium text-slate-400">
          <UserAuth onUserChange={setCurrentUser} />
             
          <div className="h-4 w-px bg-slate-700"></div>
          <a 
            href="https://regex101.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
          >
            <span>Regex Cheat Sheet</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="flex-1 max-w-[1450px] w-full mx-auto px-2 py-4 space-y-4">
        
        {/* Presets Bento Strip */}
        <section className="bg-[#1E293B]/40 border border-slate-800 rounded-lg p-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Rule Sets</h2>
            </div>
          </div>

          <div className="space-y-4">
            {/* Built-in Rule Sets */}
            <div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Built-in</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {DEFAULT_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => loadPreset(preset)}
                      className={`flex flex-col items-start text-left p-2.5 rounded border transition-all duration-150 group relative cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-xs'
                          : 'border-slate-800 bg-[#1E293B]/25 text-slate-400 hover:border-slate-700 hover:bg-[#1E293B]/50'
                      }`}
                    >
                      <h3 className={`text-[11px] font-semibold truncate w-full ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                        {preset.name}
                      </h3>
                      <p className="text-[10px] mt-0.5 leading-relaxed text-slate-500 line-clamp-1 w-full" title={preset.description}>
                        {preset.description}
                      </p>
                      <div className="mt-2 flex items-center justify-between w-full text-[9px] font-mono">
                        <span className={`px-1 rounded-sm uppercase tracking-wider ${
                          isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {preset.rules.length} rule{preset.rules.length !== 1 && 's'}
                        </span>
                        <span className={`flex items-center gap-0.5 ${
                          isSelected ? 'text-indigo-400 font-semibold' : 'text-slate-550 group-hover:text-slate-300 transition-colors'
                        }`}>
                          {isSelected ? 'Active' : 'Load'} <ChevronRight className="w-2.5 h-2.5" />
                        </span>
                      </div>

                      {/* Detailed Hover Tooltip */}
                      <div className="absolute top-[105%] left-1/2 -translate-x-1/2 w-80 bg-slate-900/95 border border-slate-750 rounded-xl p-4 shadow-2xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 ease-out origin-top z-50 backdrop-blur-md">
                        <div className="space-y-3 text-left">
                          <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{preset.name}</h4>
                            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed whitespace-normal font-normal">
                              {preset.description}
                            </p>
                          </div>
                          
                          <div className="border-t border-slate-800 pt-2">
                            <h5 className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest mb-1.5">Rule Breakdown</h5>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {preset.rules.map((rule, rIdx) => (
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
                            <span>Total: {preset.rules.length} patterns</span>
                            <span>Click to load ruleset</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Rule Sets */}
            <div className="pt-2 border-t border-slate-800/40">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono flex items-center gap-2">
                Custom
                {templatesLoading && <Loader2 className="w-2.5 h-2.5 animate-spin text-indigo-400" />}
              </div>
              
              {!currentUser ? (
                <div className="p-4 rounded border border-dashed border-slate-800/60 bg-[#1E293B]/10 text-center text-slate-500 text-[10px]">
                  <span>Create an account or sign in to save your own custom rules as rule sets!</span>
                </div>
              ) : templates.length === 0 ? (
                <div className="p-4 rounded border border-dashed border-slate-800/60 bg-[#1E293B]/10 text-center text-slate-500 text-[10px]">
                  {templatesLoading ? 'Loading saved rule sets...' : 'No saved rule sets found. Set up some scrubbing rules and click "Save Rule Set" below.'}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {templates.map((template) => {
                    const isSelected = selectedTemplateId === template.id;
                    return (
                      <div
                        key={template.id}
                        className={`flex flex-col items-start text-left p-2.5 rounded border transition-all duration-150 group relative cursor-pointer ${
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
                          <h3 className={`text-[11px] font-semibold truncate pr-6 w-full ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                            {template.name}
                          </h3>
                          <p className="text-[10px] mt-0.5 leading-relaxed text-slate-500 line-clamp-1 w-full" title={template.description || 'No description.'}>
                            {template.description || 'No description.'}
                          </p>
                          <div className="mt-2 flex items-center justify-between w-full text-[9px] font-mono">
                            <span className={`px-1 rounded-sm uppercase tracking-wider ${
                              isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'
                            }`}>
                              {template.rules.length} rule{template.rules.length !== 1 && 's'}
                            </span>
                            <span className={`flex items-center gap-0.5 ${
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
                          className="absolute top-2.5 right-2.5 p-1 rounded hover:bg-rose-950/30 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Delete Rule Set"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Custom Detailed Tooltip for custom templates */}
                        <div className="absolute top-[105%] left-1/2 -translate-x-1/2 w-80 bg-slate-900/95 border border-slate-750 rounded-xl p-4 shadow-2xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 ease-out origin-top z-50 backdrop-blur-md">
                          <div className="space-y-3 text-left">
                            <div>
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider">{template.name}</h4>
                              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed whitespace-normal font-normal">
                                {template.description || 'No description provided.'}
                              </p>
                            </div>
                            
                            <div className="border-t border-slate-800 pt-2">
                              <h5 className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest mb-1.5">Rule Breakdown</h5>
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {template.rules && template.rules.map((rule, rIdx) => (
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
                              <span>Total: {template.rules ? template.rules.length : 0} patterns</span>
                              <span>Click to load ruleset</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Workspace Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-[56%_minmax(0,1fr)] gap-4 items-start">
          
          {/* Left Block: Editor Panels (Input, Output, Visualizer) */}
          <div className="space-y-4">
            
            {/* Input Panel */}
            <div className="bg-[#1E293B]/20 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800 bg-[#1E293B]/60">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Source Input</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(inputText, true)}
                    disabled={!inputText}
                    title="Copy input text"
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    {inputCopySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
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
                />
                
                {/* Statistics Row */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-500">
                  <div className="flex items-center gap-3">
                    <span>Chars: <strong className="text-slate-400">{inputText.length.toLocaleString()}</strong></span>
                    <span>Words: <strong className="text-slate-400">{cleanResult.originalWordCount.toLocaleString()}</strong></span>
                  </div>
                  {inputText && (
                    <button
                      type="button"
                      onClick={() => {
                        const randomPreset = DEFAULT_PRESETS[Math.floor(Math.random() * DEFAULT_PRESETS.length)];
                        setInputText(randomPreset.sampleText);
                        setSelectedPresetId(null);
                      }}
                      className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3 animate-spin-hover" />
                      Rotate Random Sample
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Output / Resulting Box Card */}
            <div className="bg-[#1E293B]/20 border border-slate-800 rounded-lg overflow-hidden">
              
              {/* Tab Selector & Header */}
              <div className="flex items-center justify-between px-3.5 border-b border-slate-800 bg-[#1E293B]/60">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('cleaned')}
                    className={`py-2.5 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      activeTab === 'cleaned'
                        ? 'border-indigo-500 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Scrubbed Output (Read-Only)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('visualizer')}
                    className={`py-2.5 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      activeTab === 'visualizer'
                        ? 'border-indigo-500 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Matches View
                  </button>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(cleanResult.cleanedText, false)}
                    disabled={!cleanResult.cleanedText}
                    title="Copy"
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
                    title="Download"
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              <div className="p-3 bg-[#020617]">
                {activeTab === 'cleaned' ? (
                  <div className="space-y-3">
                    <textarea
                      value={cleanResult.cleanedText}
                      readOnly
                      placeholder="Srubbed output will render here..."
                      className="w-full h-64 sm:h-80 font-mono text-xs text-slate-400 bg-transparent border-0 outline-none resize-y placeholder:text-slate-600 select-all"
                      spellCheck={false}
                    />

                    {/* Compact stats bar */}
                    <div className="grid grid-cols-4 gap-2 p-2 bg-[#1E293B]/30 rounded border border-slate-900 text-center">
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                          Final Chars
                        </div>
                        <div className="text-sm font-semibold text-slate-300 mt-0.5">
                          {cleanResult.cleanedCharCount.toLocaleString()}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                          Final Words
                        </div>
                        <div className="text-sm font-semibold text-slate-300 mt-0.5">
                          {cleanResult.cleanedWordCount.toLocaleString()}
                        </div>
                      </div>

                      <div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                          Matches Scrubbed
                        </div>
                        <div className="text-sm font-semibold text-red-400 mt-0.5">
                          {cleanResult.totalMatchesRemoved.toLocaleString()}
                        </div>
                      </div>

                      <div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                          Reduction
                        </div>
                        <div className={`text-sm font-semibold mt-0.5 ${reductionPercentage > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                          -{reductionPercentage}%
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <InteractiveDiff originalText={inputText} rules={rules} />
                )}
              </div>
            </div>

          </div>

          {/* Right Block: Regex Pattern Configurations */}
          <div className="space-y-4">
            <AIRegexGenerator 
              onAddRule={(newRule) => {
                setRules([newRule, ...rules]);
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

        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="h-6 bg-indigo-600 text-white text-[10px] flex items-center justify-between px-3 font-mono mt-auto select-none">
        <div className="flex items-center gap-4">
          <span>MODE: SEQUENCE_REPLACE</span>
          <span className="opacity-60">|</span>
          <span>BUFFER: {((inputText.length * 2) / 1024).toFixed(2)} KB</span>
          <span className="opacity-60">|</span>
          <span className="text-emerald-300 font-semibold">MATCHES FOUND: {cleanResult.totalMatchesRemoved}</span>
        </div>
        <div className="flex items-center gap-3">
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
              <div className="flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-indigo-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                  Save Custom Rule Set
                </span>
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
          <div className="relative w-full max-w-sm bg-[#1E293B] border border-slate-800 rounded-xl shadow-2xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center mx-auto text-indigo-400">
              <Bookmark className="w-6 h-6" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Authentication Required</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                You must sign in or create an account to save your custom rules as reusable rule sets.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAuthPromptOpen(false);
                  const authBtn = document.querySelector('button[title*="Sign In"], button[onClick*="signin"]') as HTMLButtonElement;
                  if (authBtn) {
                    authBtn.click();
                  } else {
                    const buttons = Array.from(document.querySelectorAll('header button'));
                    const signInBtn = buttons.find(b => b.textContent?.toLowerCase().includes('sign in')) as HTMLButtonElement;
                    if (signInBtn) signInBtn.click();
                  }
                }}
                className="w-full h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                Sign In or Sign Up Now
              </button>
              <button
                type="button"
                onClick={() => setIsAuthPromptOpen(false)}
                className="w-full h-8 flex items-center justify-center bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
