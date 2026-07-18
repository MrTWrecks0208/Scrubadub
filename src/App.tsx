import React, { useState, useEffect, useMemo } from 'react';
import { RegexRule, RegexPreset, CleanResult } from './types';
import { DEFAULT_PRESETS } from './presets';
import { cleanText } from './utils/cleaner';
import PatternManager from './components/PatternManager';
import InteractiveDiff from './components/InteractiveDiff';
import AIRegexGenerator from './components/AIRegexGenerator';
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
  Info
} from 'lucide-react';

export default function App() {
  // --- States ---
  const [inputText, setInputText] = useState<string>(() => {
    const saved = localStorage.getItem('regex_cleaner_input');
    return saved !== null ? saved : DEFAULT_PRESETS[0].sampleText;
  });

  const [rules, setRules] = useState<RegexRule[]>(() => {
    const saved = localStorage.getItem('regex_cleaner_rules');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Failed to parse saved rules:', err);
      }
    }
    return DEFAULT_PRESETS[0].rules;
  });

  const [activeTab, setActiveTab] = useState<'cleaned' | 'visualizer'>('cleaned');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(() => {
    return localStorage.getItem('regex_cleaner_preset_id') || 'pii-redactor';
  });

  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [inputCopySuccess, setInputCopySuccess] = useState<boolean>(false);

  // --- Sync to Local Storage ---
  useEffect(() => {
    localStorage.setItem('regex_cleaner_input', inputText);
  }, [inputText]);

  useEffect(() => {
    localStorage.setItem('regex_cleaner_rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    if (selectedPresetId) {
      localStorage.setItem('regex_cleaner_preset_id', selectedPresetId);
    } else {
      localStorage.removeItem('regex_cleaner_preset_id');
    }
  }, [selectedPresetId]);

  // --- Compute Cleaning ---
  const cleanResult = useMemo<CleanResult>(() => {
    return cleanText(inputText, rules);
  }, [inputText, rules]);

  // --- Actions ---
  const loadPreset = (preset: RegexPreset) => {
    setRules(preset.rules);
    setInputText(preset.sampleText);
    setSelectedPresetId(preset.id);
  };

  const handleCustomRuleChange = (newRules: RegexRule[]) => {
    setRules(newRules);
    // If rules are customized, deselect current preset highlight
    setSelectedPresetId(null);
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
      <header className="h-12 border-b border-slate-800 flex items-center justify-between px-4 bg-[#1E293B] sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center text-white">
            <Scissors className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <h1 className="text-xs font-bold tracking-wider text-white uppercase">
              Text Scrubber
            </h1>
            <span className="text-[10px] text-slate-500 font-mono">v2.4.0</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-[11px] font-medium text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Ready
          </span>
          <div className="h-4 w-px bg-slate-700"></div>
          <a 
            href="https://regexr.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
          >
            <span>Cheat Sheet</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-4">
        
        {/* Presets Bento Strip */}
        <section className="bg-[#1E293B]/40 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Templates & Presets</h2>
          </div>
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
                  <p className="text-[10px] mt-0.5 leading-relaxed text-slate-500 line-clamp-1 w-full">
                    {preset.description}
                  </p>
                  <div className="mt-2 flex items-center justify-between w-full text-[9px] font-mono">
                    <span className={`px-1 rounded-sm uppercase tracking-wider ${
                      isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {preset.rules.length} rule{preset.rules.length !== 1 && 's'}
                    </span>
                    <span className={`flex items-center gap-0.5 ${
                      isSelected ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300 transition-opacity'
                    }`}>
                      Load <ChevronRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Workspace Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* Left Block: Editor Panels (Input, Output, Visualizer) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Input Panel */}
            <div className="bg-[#1E293B]/20 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800 bg-[#1E293B]/60">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Source Text Input</span>
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
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste raw data / log content here..."
                  className="w-full h-40 sm:h-48 font-mono text-xs text-slate-300 bg-transparent border-0 outline-none focus:ring-0 resize-y placeholder:text-slate-600"
                  spellCheck={false}
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
                    Sanitized Output (Read-Only)
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
                    Match Highlight View
                  </button>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(cleanResult.cleanedText, false)}
                    disabled={!cleanResult.cleanedText}
                    title="Copy cleaned result"
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
                    title="Download cleaned file"
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
                      placeholder="Sanitized content will render here..."
                      className="w-full h-40 sm:h-48 font-mono text-xs text-slate-400 bg-transparent border-0 outline-none resize-y placeholder:text-slate-600 select-all"
                      spellCheck={false}
                    />

                    {/* Compact stats bar */}
                    <div className="grid grid-cols-4 gap-2 p-2 bg-[#1E293B]/30 rounded border border-slate-900 text-center">
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                          Final Chars
                        </div>
                        <div className="text-xs font-bold text-slate-300 mt-0.5">
                          {cleanResult.cleanedCharCount.toLocaleString()}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                          Final Words
                        </div>
                        <div className="text-xs font-bold text-slate-300 mt-0.5">
                          {cleanResult.cleanedWordCount.toLocaleString()}
                        </div>
                      </div>

                      <div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                          Matches Scrubbed
                        </div>
                        <div className="text-xs font-bold text-red-400 mt-0.5">
                          {cleanResult.totalMatchesRemoved.toLocaleString()}
                        </div>
                      </div>

                      <div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                          Reduction
                        </div>
                        <div className={`text-xs font-bold mt-0.5 ${reductionPercentage > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
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

            {/* Quick guide on regex basics */}
            <div className="bg-[#1E293B]/25 border border-slate-800 rounded-lg p-3 flex gap-3 text-[11px] text-slate-400 leading-relaxed">
              <div className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center flex-none mt-0.5 text-indigo-400">
                <Info className="w-3 h-3" />
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-slate-300 block uppercase tracking-wide text-[10px]">Processing Pipeline Information</span>
                <p>
                  Regular expression rules are executed <strong>sequentially from top to bottom</strong>. The sanitized output of each stage acts as the feedstock for the next. Drag, toggle, and name patterns to build repeatable data sanitization processes.
                </p>
              </div>
            </div>

          </div>

          {/* Right Block: Regex Pattern Configurations (5/12 width) */}
          <div className="lg:col-span-5 space-y-4">
            <AIRegexGenerator 
              onAddRule={(newRule) => {
                setRules([...rules, newRule]);
                setSelectedPresetId(null);
              }} 
              sampleText={inputText}
            />
            <PatternManager 
              rules={rules} 
              onChange={handleCustomRuleChange} 
              ruleStats={cleanResult.ruleStats} 
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
    </div>
  );
}
