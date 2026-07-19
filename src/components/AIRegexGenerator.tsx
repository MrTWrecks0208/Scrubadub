import React, { useState } from 'react';
import { RegexRule } from '../types';
import { Sparkles, Plus, Loader2, ArrowRight, CornerDownRight, Check, HelpCircle } from 'lucide-react';

interface AIRegexGeneratorProps {
  onAddRule: (rule: RegexRule) => void;
  sampleText?: string;
}

interface GeneratedRegex {
  name: string;
  pattern: string;
  replacement: string;
  global: boolean;
  caseInsensitive: boolean;
  multiline: boolean;
  dotAll: boolean;
  explanation: string;
}

export default function AIRegexGenerator({ onAddRule, sampleText }: AIRegexGeneratorProps) {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedRegex | null>(null);
  const [isApplied, setIsApplied] = useState(false);

  const isStaticPages = typeof window !== 'undefined' && (
    window.location.hostname.endsWith('github.io') || 
    window.location.hostname.includes('vercel.app') || 
    window.location.hostname.includes('netlify.app')
  );

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsLoading(true);
    setError(null);
    setGenerated(null);
    setIsApplied(false);

    try {
      const response = await fetch('/api/ai/generate-regex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: description,
          sampleText: sampleText,
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('AI formulation backend is not available on static hosting (like GitHub Pages). To use AI generation, run the app locally using "npm run dev", or deploy it on a dynamic server-capable environment.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGenerated(data);
    } catch (err: any) {
      console.error('Error generating regex:', err);
      setError(err.message || 'An unexpected error occurred. Please verify your connection and API key configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!generated) return;

    const newRule: RegexRule = {
      id: crypto.randomUUID(),
      name: generated.name,
      pattern: generated.pattern,
      replacement: generated.replacement,
      flags: {
        global: generated.global,
        caseInsensitive: generated.caseInsensitive,
        multiline: generated.multiline,
        dotAll: generated.dotAll,
      },
      isActive: true,
    };

    onAddRule(newRule);
    setIsApplied(true);
    setTimeout(() => {
      setIsApplied(false);
      setGenerated(null);
      setDescription('');
    }, 2000);
  };

  return (
    <div className="bg-[#1E293B]/20 border border-slate-800 rounded-lg overflow-hidden flex flex-col p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">AI Regex formulation</h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Describe what to find and replace</p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleGenerate} className="space-y-3">
        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='e.g., "replace social security numbers formatted as XXX-XX-XXXX with [REDACTED]" or "remove HTML style tags"...'
            rows={2}
            className="w-full px-3 py-2 text-xs text-slate-300 bg-[#020617] border border-slate-900 rounded outline-none placeholder:text-slate-600 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-none font-sans"
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          {isStaticPages ? (
            <span className="text-[10px] text-amber-500 font-mono font-medium max-w-[240px] leading-tight">
              ⚠️ Static Hosting: AI requires backend API (disabled on GitHub Pages)
            </span>
          ) : (
            <div />
          )}
          <button
            type="submit"
            disabled={isLoading || !description.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-500 transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:pointer-events-none uppercase tracking-wider"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-200" />
                <span>Formulating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                <span>Generate Rule</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="text-xs text-red-400 font-mono bg-red-950/20 border border-red-900/40 rounded p-2.5 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-red-300 block">Generation Failed</span>
            <p className="leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Results Box */}
      {generated && (
        <div className="bg-[#020617] border border-slate-900 rounded-lg p-3.5 space-y-3 animate-fadeIn">
          {/* Headline */}
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Proposed Rule</span>
              <span className="text-slate-500 text-xs">/</span>
              <span className="text-xs font-bold text-slate-200 truncate max-w-[180px]">{generated.name}</span>
            </div>
            
            <button
              type="button"
              onClick={handleApply}
              disabled={isApplied}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                isApplied
                  ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-300'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {isApplied ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Applied</span>
                </>
              ) : (
                <>
                  <Plus className="w-3 h-3" />
                  <span>Apply Rule</span>
                </>
              )}
            </button>
          </div>

          {/* Regex Display */}
          <div className="space-y-2">
            <div className="flex flex-col gap-1.5 bg-[#1E293B]/20 border border-slate-900 rounded p-2 font-mono text-xs">
              <div className="flex items-center gap-1 text-indigo-400">
                <span className="text-slate-600 font-bold select-none">/</span>
                <span className="text-slate-100 font-semibold break-all">{generated.pattern}</span>
                <span className="text-slate-600 font-bold select-none">/</span>
                <span className="text-indigo-300 font-bold">
                  {[
                    generated.global ? 'g' : '',
                    generated.caseInsensitive ? 'i' : '',
                    generated.multiline ? 'm' : '',
                    generated.dotAll ? 's' : ''
                  ].join('')}
                </span>
              </div>
              
              <div className="flex items-baseline gap-1.5 text-[11px] text-slate-500 pt-1.5 border-t border-slate-900">
                <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider">Subst:</span>
                {generated.replacement ? (
                  <span className="text-emerald-400 font-bold">"{generated.replacement}"</span>
                ) : (
                  <span className="text-slate-600 italic">Strip/delete match</span>
                )}
              </div>
            </div>

            {/* Explanation */}
            <div className="flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed bg-slate-950/40 p-2 rounded">
              <CornerDownRight className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
              <p>{generated.explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
