import React from 'react';
import { RegexRule, CleanResult, HIGHLIGHT_COLORS, getStableRuleColor } from '../types';
import { Plus, Trash2, Eye, EyeOff, AlertCircle, Sparkles, Check, HelpCircle, Bookmark, Pencil, Info } from 'lucide-react';
import { validateRegex } from '../utils/cleaner';

interface PatternManagerProps {
  rules: RegexRule[];
  onChange: (rules: RegexRule[]) => void;
  ruleStats: CleanResult['ruleStats'];
  onSaveTemplate?: () => void;
}

export default function PatternManager({ rules, onChange, ruleStats, onSaveTemplate }: PatternManagerProps) {
  const [focusedRuleId, setFocusedRuleId] = React.useState<string | null>(null);

  const addRule = () => {
    const newRuleId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : 'rule_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const newRule: RegexRule = {
      id: newRuleId,
      pattern: '',
      replacement: '',
      flags: {
        global: true,
        caseInsensitive: true,
        multiline: false,
        dotAll: false,
      },
      isActive: true,
      name: 'New Rule',
    };
    onChange([newRule, ...rules]);
  };

  const updateRule = (id: string, updates: Partial<RegexRule>) => {
    onChange(
      rules.map((r) => {
        if (r.id === id) {
          return { ...r, ...updates };
        }
        return r;
      })
    );
  };

  const updateFlag = (id: string, flag: keyof RegexRule['flags'], value: boolean) => {
    const rule = rules.find((r) => r.id === id);
    if (rule) {
      updateRule(id, {
        flags: {
          ...rule.flags,
          [flag]: value,
        },
      });
    }
  };

  const [allState, setAllState] = React.useState<'on' | 'off' | 'none'>('none');
  const [savedRules, setSavedRules] = React.useState<RegexRule[] | null>(null);

  const deleteRule = (id: string) => {
    onChange(rules.filter((r) => r.id !== id));
  };

  React.useEffect(() => {
    // If rules are cleared or their IDs or length changed completely (e.g. loading a preset),
    // reset the toggle state.
    if (savedRules) {
      const currentIds = rules.map(r => r.id).join(',');
      const savedIds = savedRules.map(r => r.id).join(',');
      if (currentIds !== savedIds) {
        setAllState('none');
        setSavedRules(null);
        return;
      }
    }

    // Reset toggle state if individual rules are manually toggled or edited
    if (allState === 'on') {
      const anyInactive = rules.some(r => !r.isActive);
      if (anyInactive) {
        setAllState('none');
        setSavedRules(null);
      }
    } else if (allState === 'off') {
      const anyActive = rules.some(r => r.isActive);
      if (anyActive) {
        setAllState('none');
        setSavedRules(null);
      }
    }
  }, [rules, allState, savedRules]);

  const handleAllOn = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    if (allState === 'on') {
      if (savedRules) {
        onChange(savedRules);
      }
      setAllState('none');
      setSavedRules(null);
    } else {
      setSavedRules(rules);
      setAllState('on');
      onChange(rules.map((r) => ({ ...r, isActive: true })));
    }
  };

  const handleAllOff = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    if (allState === 'off') {
      if (savedRules) {
        onChange(savedRules);
      }
      setAllState('none');
      setSavedRules(null);
    } else {
      setSavedRules(rules);
      setAllState('off');
      onChange(rules.map((r) => ({ ...r, isActive: false })));
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1E293B]/20 border border-slate-800 rounded-lg overflow-hidden select-none">
      {/* Header */}
      <div className="flex flex-col justify-center px-4 py-3.5 border-b border-slate-800 bg-[#1E293B]/60 gap-2">
        {/* First Line: Scrubbing Rules with count on left, Action buttons on right */}
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 shrink-0 whitespace-nowrap">
            Scrubbing Rules
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-mono font-bold bg-[#020617] border border-slate-800 text-indigo-400 rounded-full">
              {rules.length}
            </span>
          </h2>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {rules.length > 0 && onSaveTemplate && (
              <button
                type="button"
                onClick={onSaveTemplate}
                className="flex items-center gap-1 h-6.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-[9px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer uppercase tracking-wider whitespace-nowrap flex-shrink-0"
              >
                <Bookmark className="w-3 h-3" />
                Save Rule Set
              </button>
            )}
            {rules.length > 0 && (
              <div className="flex items-center border border-slate-800 rounded-full p-0.5 bg-[#020617] h-6.5 text-[9px] font-mono flex-shrink-0">
                <button
                  type="button"
                  onClick={handleAllOn}
                  className={`h-full px-2 rounded-full font-semibold transition-colors cursor-pointer flex items-center uppercase tracking-wider whitespace-nowrap ${
                    allState === 'on'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  All On
                </button>
                <div className="w-[1px] h-2.5 bg-slate-800 mx-0.5"></div>
                <button
                  type="button"
                  onClick={handleAllOff}
                  className={`h-full px-2 rounded-full font-semibold transition-colors cursor-pointer flex items-center uppercase tracking-wider whitespace-nowrap ${
                    allState === 'off'
                      ? 'bg-rose-500/15 text-rose-400'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  All Off
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={addRule}
              className="flex items-center gap-1 h-6.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-[9px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer uppercase tracking-wider whitespace-nowrap flex-shrink-0"
            >
              <Plus className="w-3 h-3" />
              Add Rule
            </button>
          </div>
        </div>

        {/* Second Line: Description under Scrubbing Rules */}
        <div>
          <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
            <span>Define rules for scrubbing text</span>
            <span className="relative group/info inline-flex items-center cursor-help">
              <svg 
                viewBox="0 0 16 16" 
                className="w-3.5 h-3.5 fill-slate-500 hover:fill-indigo-400 transition-colors"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  fillRule="evenodd" 
                  clipRule="evenodd" 
                  d="M8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0ZM8 3.5C8.69 3.5 9.25 4.06 9.25 4.75C9.25 5.44 8.69 6 8 6C7.31 6 6.75 5.44 6.75 4.75C6.75 4.06 7.31 3.5 8 3.5ZM7.7 7.2H8.3C8.74 7.2 9.1 7.56 9.1 8V11.4C9.1 11.84 8.74 12.2 8.3 12.2H7.7C7.26 12.2 6.9 11.84 6.9 11.4V8C6.9 7.56 7.26 7.2 7.7 7.2Z" 
                />
              </svg>
              <span className="absolute top-full left-0 mt-1.5 w-72 p-3 bg-slate-900/95 border border-slate-750 text-slate-300 text-[11px] rounded-xl shadow-2xl opacity-0 scale-95 pointer-events-none group-hover/info:opacity-100 group-hover/info:scale-100 transition-all duration-150 z-50 normal-case font-sans leading-relaxed backdrop-blur-md">
                <span className="font-bold text-white block uppercase tracking-wider text-[10px] mb-1">
                  Scrubbing Pipeline Information
                </span>
                Scrubbing rules are executed <strong>sequentially from top to bottom</strong>. The scrubbed output of each stage serves as the input for the next. Toggle, customize, and name rules to build repeatable text-cleansing workflows.
              </span>
            </span>
          </p>
        </div>
      </div>

      {/* Rules List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[500px] lg:max-h-[620px]">
        {rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-800 rounded-lg px-4 bg-[#1E293B]/10">
            <div className="w-8 h-8 rounded-full bg-[#1E293B]/50 flex items-center justify-center mb-2.5 border border-slate-800">
              <HelpCircle className="w-4 h-4 text-slate-500 animate-pulse" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">No Active Rules</h3>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
              Add a rule or select a template to start.
            </p>
            <button
              type="button"
              onClick={addRule}
              className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 border border-slate-700 text-slate-300 bg-[#1E293B]/40 rounded text-[11px] font-bold hover:bg-[#1E293B]/80 transition-colors cursor-pointer uppercase tracking-wider"
            >
              <Plus className="w-3 h-3" />
              Create First Rule
            </button>
          </div>
        ) : (
          rules.map((rule, index) => {
            const stats = ruleStats.find((s) => s.ruleId === rule.id);
            const matchesCount = stats?.matchesRemoved ?? 0;
            const isValid = stats?.isValid ?? true;
            const errorMsg = stats?.errorMsg;
            const color = getStableRuleColor(rule.id, rules);
            const isFocused = focusedRuleId === rule.id;

            return (
              <div
                key={rule.id}
                className={`relative flex flex-col p-3 rounded border transition-all duration-150 ${
                  rule.isActive
                    ? 'bg-slate-800/30 border-slate-800 shadow-xs'
                    : 'bg-slate-900/40 border-slate-800/60 opacity-60'
                }`}
              >
                {/* Rule Title Row */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="relative flex items-center flex-1 min-w-0 group/name">
                      <input
                        type="text"
                        value={rule.name}
                        onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                        placeholder="Rule name..."
                        className={`text-xs font-mono font-bold bg-[#020617]/45 hover:bg-[#020617]/80 focus:bg-[#020617] px-2 py-0.5 pr-7 rounded border border-slate-800/60 focus:border-indigo-500/50 outline-none w-full min-w-0 truncate transition-all ${
                          rule.isActive ? color.textClass : 'text-slate-500'
                        }`}
                        title="Click to rename rule"
                      />
                      <Pencil className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-550 group-hover/name:text-slate-400 focus-within/name:opacity-0 pointer-events-none transition-colors" />
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Active Match Stat Badge */}
                    {rule.isActive && rule.pattern && isValid && (
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border transition-colors ${
                        matchesCount > 0
                          ? color.badgeClass
                          : 'bg-[#020617] text-slate-500 border-slate-900'
                      }`}>
                        {matchesCount} match{matchesCount !== 1 && 'es'}
                      </span>
                    )}

                    {/* Enable / Disable Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => updateRule(rule.id, { isActive: !rule.isActive })}
                      title={rule.isActive ? 'Disable rule' : 'Enable rule'}
                      className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out outline-none border border-transparent ${
                        rule.isActive ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-red-500 hover:bg-red-400'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-[1px] ml-[1px] ${
                          rule.isActive ? 'translate-x-3.5' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => deleteRule(rule.id)}
                      title="Delete rule"
                      className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                 {/* Regex Pattern Input */}
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-600 select-none">
                    /
                  </span>
                  <input
                    type="text"
                    value={rule.pattern}
                    onChange={(e) => updateRule(rule.id, { pattern: e.target.value })}
                    onFocus={() => setFocusedRuleId(rule.id)}
                    onBlur={() => setFocusedRuleId(null)}
                    placeholder="[a-zA-Z]+ or \d+ ..."
                    className={`w-full pl-5 pr-14 py-1.5 font-mono text-xs rounded border outline-none transition-all ${
                      !rule.isActive
                        ? 'bg-[#020617]/50 border-slate-900 text-slate-600'
                        : isFocused
                        ? 'border-indigo-500/50 bg-[#020617] text-slate-300 ring-1 ring-indigo-500/50'
                        : !isValid
                        ? 'border-red-900/40 bg-red-950/20 text-red-300 focus:ring-1 focus:ring-red-500 focus:border-red-500'
                        : rule.pattern
                        ? 'border-slate-900 bg-[#020617] text-slate-300 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50'
                        : 'border-slate-800 bg-[#020617] text-slate-500 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50'
                    }`}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[9px] text-slate-500 font-mono select-none pr-1">
                    /
                    {rule.flags.global && 'g'}
                    {rule.flags.caseInsensitive && 'i'}
                    {rule.flags.multiline && 'm'}
                    {rule.flags.dotAll && 's'}
                  </div>
                </div>

                {/* Replace with Input */}
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[9px] font-mono font-bold text-slate-500 select-none w-14 shrink-0 uppercase tracking-widest text-right">
                    Replace:
                  </span>
                  <input
                    type="text"
                    value={rule.replacement}
                    onChange={(e) => updateRule(rule.id, { replacement: e.target.value })}
                    placeholder="Empty (strips/deletes matches)..."
                    className={`w-full px-2 py-1 font-mono text-xs rounded border outline-none transition-all ${
                      !rule.isActive
                        ? 'bg-[#020617]/30 border-slate-900/50 text-slate-600 placeholder:text-slate-700'
                        : 'border-slate-900 bg-[#020617] text-slate-300 placeholder:text-slate-600 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50'
                    }`}
                  />
                </div>

                {/* Error Banner */}
                {!isValid && errorMsg && !isFocused && (
                  <div className="flex items-start gap-1.5 mt-2 text-[10px] text-red-400 font-mono bg-red-950/20 border border-red-900/40 rounded p-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-none mt-0.5 text-red-500" />
                    <span className="truncate leading-tight">{errorMsg}</span>
                  </div>
                )}

                {/* Flag Toggles */}
                {rule.isActive && (
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-2 pt-2 border-t border-slate-900">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 mr-1 select-none">
                      Flags:
                    </span>
                    <label className="relative group flex items-center gap-1 text-[10px] text-slate-400 font-mono hover:text-white cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rule.flags.global}
                        onChange={(e) => updateFlag(rule.id, 'global', e.target.checked)}
                        className="rounded border-slate-850 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3 h-3 bg-slate-950 cursor-pointer accent-indigo-500"
                      />
                      <span>g</span>
                      {/* Tooltip */}
                      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-50">
                        <span className="bg-slate-950 text-slate-200 text-[10px] font-sans px-2 py-1 rounded border border-slate-800 shadow-xl whitespace-nowrap">
                          Global (g) — match all occurrences
                        </span>
                        <span className="w-1.5 h-1.5 bg-slate-950 border-r border-b border-slate-800 rotate-45 -mt-[4px]"></span>
                      </span>
                    </label>
                    <label className="relative group flex items-center gap-1 text-[10px] text-slate-400 font-mono hover:text-white cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rule.flags.caseInsensitive}
                        onChange={(e) => updateFlag(rule.id, 'caseInsensitive', e.target.checked)}
                        className="rounded border-slate-850 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3 h-3 bg-slate-950 cursor-pointer accent-indigo-500"
                      />
                      <span>i</span>
                      {/* Tooltip */}
                      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-50">
                        <span className="bg-slate-950 text-slate-200 text-[10px] font-sans px-2 py-1 rounded border border-slate-800 shadow-xl whitespace-nowrap">
                          Case Insensitive (i) — ignore case differences
                        </span>
                        <span className="w-1.5 h-1.5 bg-slate-950 border-r border-b border-slate-800 rotate-45 -mt-[4px]"></span>
                      </span>
                    </label>
                    <label className="relative group flex items-center gap-1 text-[10px] text-slate-400 font-mono hover:text-white cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rule.flags.multiline}
                        onChange={(e) => updateFlag(rule.id, 'multiline', e.target.checked)}
                        className="rounded border-slate-850 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3 h-3 bg-slate-950 cursor-pointer accent-indigo-500"
                      />
                      <span>m</span>
                      {/* Tooltip */}
                      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-50">
                        <span className="bg-slate-950 text-slate-200 text-[10px] font-sans px-2 py-1 rounded border border-slate-800 shadow-xl whitespace-nowrap">
                          Multiline (m) — ^ and $ match start/end of lines
                        </span>
                        <span className="w-1.5 h-1.5 bg-slate-950 border-r border-b border-slate-800 rotate-45 -mt-[4px]"></span>
                      </span>
                    </label>
                    <label className="relative group flex items-center gap-1 text-[10px] text-slate-400 font-mono hover:text-white cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rule.flags.dotAll}
                        onChange={(e) => updateFlag(rule.id, 'dotAll', e.target.checked)}
                        className="rounded border-slate-850 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3 h-3 bg-slate-950 cursor-pointer accent-indigo-500"
                      />
                      <span>s</span>
                      {/* Tooltip */}
                      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-50">
                        <span className="bg-slate-950 text-slate-200 text-[10px] font-sans px-2 py-1 rounded border border-slate-800 shadow-xl whitespace-nowrap">
                          Dot All (s) — dot (.) matches newlines
                        </span>
                        <span className="w-1.5 h-1.5 bg-slate-950 border-r border-b border-slate-800 rotate-45 -mt-[4px]"></span>
                      </span>
                    </label>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
