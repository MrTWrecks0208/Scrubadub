import React, { useMemo, useRef, useEffect } from 'react';
import { RegexRule, HIGHLIGHT_COLORS, getStableRuleColor } from '../types';

interface HighlightedTextareaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rules: RegexRule[];
}

interface MatchRange {
  start: number;
  end: number;
  ruleIds: string[];
}

export default function HighlightedTextarea({ value, onChange, placeholder, rules }: HighlightedTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Synchronize scroll of backdrop with the textarea
  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const isTooLarge = value.length > 20000;

  // Segment calculation for highlights
  const highlightedSegments = useMemo(() => {
    if (isTooLarge || !value) {
      return [{ isMatch: false, text: value || '', ruleIds: [] }];
    }

    let ranges: MatchRange[] = [];

    // Gather matches from all active rules
    for (const rule of rules) {
      if (!rule.isActive || !rule.pattern) continue;

      let flags = 'g';
      if (rule.flags.caseInsensitive) flags += 'i';
      if (rule.flags.multiline) flags += 'm';
      if (rule.flags.dotAll) flags += 's';

      try {
        const rx = new RegExp(rule.pattern, flags);
        const matches = Array.from(value.matchAll(rx));
        for (const match of matches) {
          if (match.index === undefined) continue;
          const start = match.index;
          const end = start + match[0].length;
          if (start === end) continue;

          ranges.push({
            start,
            end,
            ruleIds: [rule.id],
          });
        }
      } catch (e) {
        // Ignore invalid regexes during typing
      }
    }

    if (ranges.length === 0) {
      return [{ isMatch: false, text: value, ruleIds: [] }];
    }

    // Sort and merge overlapping ranges
    ranges.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return b.end - a.end;
    });

    const mergedRanges: MatchRange[] = [];
    let current = { ...ranges[0], ruleIds: [...ranges[0].ruleIds] };

    for (let i = 1; i < ranges.length; i++) {
      const next = ranges[i];
      if (next.start < current.end) {
        if (next.end > current.end) {
          current.end = next.end;
        }
        next.ruleIds.forEach(id => {
          if (!current.ruleIds.includes(id)) {
            current.ruleIds.push(id);
          }
        });
      } else {
        mergedRanges.push(current);
        current = { ...next, ruleIds: [...next.ruleIds] };
      }
    }
    mergedRanges.push(current);

    // Build segment elements
    const segments: { isMatch: boolean; text: string; ruleIds: string[]; start?: number; end?: number }[] = [];
    let lastPos = 0;

    for (const range of mergedRanges) {
      if (range.start > lastPos) {
        segments.push({
          isMatch: false,
          text: value.slice(lastPos, range.start),
          ruleIds: [],
        });
      }

      segments.push({
        isMatch: true,
        text: value.slice(range.start, range.end),
        ruleIds: range.ruleIds,
        start: range.start,
        end: range.end,
      });

      lastPos = range.end;
    }

    if (lastPos < value.length) {
      segments.push({
        isMatch: false,
        text: value.slice(lastPos),
        ruleIds: [],
      });
    }

    return segments;
  }, [value, rules, isTooLarge]);

  // Keep scroll in sync if value updates externally
  useEffect(() => {
    handleScroll();
  }, [value]);

  const activeMatchesCount = useMemo(() => {
    return highlightedSegments.filter(s => s.isMatch).length;
  }, [highlightedSegments]);

  // Track last visited match index per rule for cycling through matches
  const lastMatchIndices = useRef<Record<string, number>>({});

  const handleJumpToRuleMatch = (rule: RegexRule) => {
    if (!rule.isActive || !rule.pattern || !textareaRef.current) return;

    let flags = 'g';
    if (rule.flags.caseInsensitive) flags += 'i';
    if (rule.flags.multiline) flags += 'm';
    if (rule.flags.dotAll) flags += 's';

    try {
      const rx = new RegExp(rule.pattern, flags);
      const matches = Array.from(value.matchAll(rx)).filter(m => m.index !== undefined && m[0].length > 0);
      if (matches.length === 0) return;

      const currentIndex = lastMatchIndices.current[rule.id] || 0;
      const targetMatch = matches[currentIndex % matches.length];
      lastMatchIndices.current[rule.id] = (currentIndex + 1) % matches.length;

      const start = targetMatch.index!;
      const end = start + targetMatch[0].length;

      // 1. Smoothly scroll the browser page if the Source Input box is out of view
      textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 2. Determine exact vertical pixel offset inside backdrop taking wrapped lines into account
      let targetScrollTop = 0;
      let markEl = backdropRef.current?.querySelector(`[data-match-start="${start}"]`) as HTMLElement | null;
      if (!markEl && backdropRef.current) {
        const allMarks = Array.from(backdropRef.current.querySelectorAll('mark[data-match-start]')) as HTMLElement[];
        for (const m of allMarks) {
          const mStart = parseInt(m.getAttribute('data-match-start') || '-1', 10);
          const mEnd = parseInt(m.getAttribute('data-match-end') || '-1', 10);
          if (mStart <= start && mEnd >= start) {
            markEl = m;
            break;
          }
        }
      }

      const containerHeight = textareaRef.current.clientHeight || 250;

      if (markEl) {
        targetScrollTop = Math.max(0, markEl.offsetTop - containerHeight / 2 + 10);
      } else {
        const textBefore = value.slice(0, start);
        const lineNumber = textBefore.split('\n').length - 1;
        const lineHeight = 20;
        const padding = 12;
        targetScrollTop = Math.max(0, padding + lineNumber * lineHeight - containerHeight / 2 + lineHeight);
      }

      // 3. Focus and set selection range without browser auto-scrolling unpredictably
      textareaRef.current.focus({ preventScroll: true });
      textareaRef.current.setSelectionRange(start, end);

      // 4. Smoothly scroll both textarea and backdrop to target vertical offset
      textareaRef.current.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      });
      if (backdropRef.current) {
        backdropRef.current.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth',
        });
      }
    } catch (e) {
      // Ignore invalid regex
    }
  };

  const getRuleMatchCount = (rule: RegexRule) => {
    if (!rule.isActive || !rule.pattern) return 0;
    let flags = 'g';
    if (rule.flags.caseInsensitive) flags += 'i';
    if (rule.flags.multiline) flags += 'm';
    if (rule.flags.dotAll) flags += 's';
    try {
      const rx = new RegExp(rule.pattern, flags);
      const matches = Array.from(value.matchAll(rx)).filter(m => m.index !== undefined && m[0].length > 0);
      return matches.length;
    } catch {
      return 0;
    }
  };

  return (
    <div className="flex flex-col space-y-1.5">
      {/* Self-contained styling to guarantee pixel-perfect text layout alignment across all browsers */}
      <style>{`
        .sync-text-styles {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
          font-size: 12px !important;
          line-height: 20px !important; /* Explicit line height */
          padding: 12px !important;
          margin: 0 !important;
          border: 0 !important;
          outline: none !important;
          box-shadow: none !important;
          box-sizing: border-box !important;
          white-space: pre-wrap !important;
          word-break: break-all !important;
          overflow-wrap: break-word !important;
          overflow-y: scroll !important;
          overflow-x: hidden !important;
        }

        /* Custom scrollbar for textarea to look stunning and consistent */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px !important;
          height: 8px !important;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.3) !important;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.4) !important;
          border-radius: 4px !important;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.6) !important;
        }
        .custom-scrollbar {
          scrollbar-color: rgba(99, 102, 241, 0.4) rgba(30, 41, 59, 0.3) !important;
          scrollbar-width: thin !important;
        }

        /* Fully transparent scrollbar for backdrop div, preserving exact same spacing */
        .hide-backdrop-scrollbar::-webkit-scrollbar {
          width: 8px !important;
          height: 8px !important;
        }
        .hide-backdrop-scrollbar::-webkit-scrollbar-track {
          background: transparent !important;
        }
        .hide-backdrop-scrollbar::-webkit-scrollbar-thumb {
          background: transparent !important;
        }
        .hide-backdrop-scrollbar {
          scrollbar-color: transparent transparent !important;
          scrollbar-width: thin !important;
        }

        .sync-text-styles mark {
          color: transparent !important;
          border-radius: 2px !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        .sync-text-styles mark.highlight-rose {
          background-color: rgba(244, 63, 94, 0.22) !important;
          border-bottom: 1.5px solid rgba(244, 63, 94, 0.55) !important;
        }
        .sync-text-styles mark.highlight-orange {
          background-color: rgba(249, 115, 22, 0.22) !important;
          border-bottom: 1.5px solid rgba(249, 115, 22, 0.55) !important;
        }
        .sync-text-styles mark.highlight-amber {
          background-color: rgba(245, 158, 11, 0.22) !important;
          border-bottom: 1.5px solid rgba(245, 158, 11, 0.55) !important;
        }
        .sync-text-styles mark.highlight-lime {
          background-color: rgba(132, 204, 22, 0.22) !important;
          border-bottom: 1.5px solid rgba(132, 204, 22, 0.55) !important;
        }
        .sync-text-styles mark.highlight-green {
          background-color: rgba(34, 197, 94, 0.22) !important;
          border-bottom: 1.5px solid rgba(34, 197, 94, 0.55) !important;
        }
        .sync-text-styles mark.highlight-emerald {
          background-color: rgba(16, 185, 129, 0.22) !important;
          border-bottom: 1.5px solid rgba(16, 185, 129, 0.55) !important;
        }
        .sync-text-styles mark.highlight-teal {
          background-color: rgba(20, 184, 166, 0.22) !important;
          border-bottom: 1.5px solid rgba(20, 184, 166, 0.55) !important;
        }
        .sync-text-styles mark.highlight-cyan {
          background-color: rgba(6, 182, 212, 0.22) !important;
          border-bottom: 1.5px solid rgba(6, 182, 212, 0.55) !important;
        }
        .sync-text-styles mark.highlight-sky {
          background-color: rgba(14, 165, 233, 0.22) !important;
          border-bottom: 1.5px solid rgba(14, 165, 233, 0.55) !important;
        }
        .sync-text-styles mark.highlight-blue {
          background-color: rgba(59, 130, 246, 0.22) !important;
          border-bottom: 1.5px solid rgba(59, 130, 246, 0.55) !important;
        }
        .sync-text-styles mark.highlight-indigo {
          background-color: rgba(99, 102, 241, 0.22) !important;
          border-bottom: 1.5px solid rgba(99, 102, 241, 0.55) !important;
        }
        .sync-text-styles mark.highlight-violet {
          background-color: rgba(139, 92, 246, 0.22) !important;
          border-bottom: 1.5px solid rgba(139, 92, 246, 0.55) !important;
        }
        .sync-text-styles mark.highlight-purple {
          background-color: rgba(168, 85, 247, 0.22) !important;
          border-bottom: 1.5px solid rgba(168, 85, 247, 0.55) !important;
        }
        .sync-text-styles mark.highlight-fuchsia {
          background-color: rgba(217, 70, 239, 0.22) !important;
          border-bottom: 1.5px solid rgba(217, 70, 239, 0.55) !important;
        }
        .sync-text-styles mark.highlight-pink {
          background-color: rgba(236, 72, 153, 0.22) !important;
          border-bottom: 1.5px solid rgba(236, 72, 153, 0.55) !important;
        }

        .indicator-rose {
          background-color: rgba(244, 63, 94, 0.22) !important;
          border-color: rgba(244, 63, 94, 0.55) !important;
        }
        .indicator-orange {
          background-color: rgba(249, 115, 22, 0.22) !important;
          border-color: rgba(249, 115, 22, 0.55) !important;
        }
        .indicator-amber {
          background-color: rgba(245, 158, 11, 0.22) !important;
          border-color: rgba(245, 158, 11, 0.55) !important;
        }
        .indicator-lime {
          background-color: rgba(132, 204, 22, 0.22) !important;
          border-color: rgba(132, 204, 22, 0.55) !important;
        }
        .indicator-green {
          background-color: rgba(34, 197, 94, 0.22) !important;
          border-color: rgba(34, 197, 94, 0.55) !important;
        }
        .indicator-emerald {
          background-color: rgba(16, 185, 129, 0.22) !important;
          border-color: rgba(16, 185, 129, 0.55) !important;
        }
        .indicator-teal {
          background-color: rgba(20, 184, 166, 0.22) !important;
          border-color: rgba(20, 184, 166, 0.55) !important;
        }
        .indicator-cyan {
          background-color: rgba(6, 182, 212, 0.22) !important;
          border-color: rgba(6, 182, 212, 0.55) !important;
        }
        .indicator-sky {
          background-color: rgba(14, 165, 233, 0.22) !important;
          border-color: rgba(14, 165, 233, 0.55) !important;
        }
        .indicator-blue {
          background-color: rgba(59, 130, 246, 0.22) !important;
          border-color: rgba(59, 130, 246, 0.55) !important;
        }
        .indicator-indigo {
          background-color: rgba(99, 102, 241, 0.22) !important;
          border-color: rgba(99, 102, 241, 0.55) !important;
        }
        .indicator-violet {
          background-color: rgba(139, 92, 246, 0.22) !important;
          border-color: rgba(139, 92, 246, 0.55) !important;
        }
        .indicator-purple {
          background-color: rgba(168, 85, 247, 0.22) !important;
          border-color: rgba(168, 85, 247, 0.55) !important;
        }
        .indicator-fuchsia {
          background-color: rgba(217, 70, 239, 0.22) !important;
          border-color: rgba(217, 70, 239, 0.55) !important;
        }
        .indicator-pink {
          background-color: rgba(236, 72, 153, 0.22) !important;
          border-color: rgba(236, 72, 153, 0.55) !important;
        }

        .sync-text-styles span {
          background: transparent !important;
          color: transparent !important;
          padding: 0 !important;
          margin: 0 !important;
        }
      `}</style>
 
      {/* Overlay Editor Container */}
      <div className="relative w-full h-64 sm:h-80 bg-[#020617] rounded border border-slate-900/50 overflow-hidden">
        {/* Backdrop Div (highlights are rendered here) */}
        <div
          ref={backdropRef}
          className="sync-text-styles hide-backdrop-scrollbar absolute inset-0 overflow-auto text-transparent pointer-events-none select-none"
        >
          {highlightedSegments.map((seg, idx) => {
            if (seg.isMatch) {
              const firstRuleId = seg.ruleIds?.[0];
              const ruleColor = firstRuleId ? getStableRuleColor(firstRuleId, rules) : null;
              const colorName = ruleColor ? ruleColor.name : 'amber';
              return (
                <mark 
                  key={idx} 
                  data-match-start={seg.start} 
                  data-match-end={seg.end}
                  className={`highlight-${colorName}`}
                  style={ruleColor ? {
                    backgroundColor: ruleColor.bg,
                    borderBottom: `1.5px solid ${ruleColor.border}`
                  } : undefined}
                >
                  {seg.text}
                </mark>
              );
            }
            return <span key={idx}>{seg.text}</span>;
          })}
          {/* Ensure last line scroll handles trailing newline correctly */}
          {value.endsWith('\n') && <span> </span>}
        </div>
 
        {/* Textarea (handles typing, editing, standard cursors) */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          placeholder={placeholder}
          className="sync-text-styles custom-scrollbar absolute inset-0 overflow-auto bg-transparent! text-slate-300 caret-indigo-400 focus:ring-0 focus:outline-hidden resize-none"
          spellCheck={false}
        />
      </div>
 
      {/* Mini status helper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400">Matched Regions ({activeMatchesCount}):</span>
          {rules.filter(r => r.isActive && highlightedSegments.some(seg => seg.isMatch && seg.ruleIds?.includes(r.id))).length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              {rules
                .filter(r => r.isActive && highlightedSegments.some(seg => seg.isMatch && seg.ruleIds?.includes(r.id)))
                .map((r) => {
                  const color = getStableRuleColor(r.id, rules);
                  const count = getRuleMatchCount(r);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleJumpToRuleMatch(r)}
                      className={`flex items-center gap-1.5 active:scale-95 px-2 py-0.5 rounded border transition-all cursor-pointer group/badge shadow-xs ${
                        color.neonButtonClass || 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border-rose-500/60 hover:border-rose-400/80'
                      }`}
                      title={`Click to jump to match in Source Text (${count} match${count !== 1 ? 'es' : ''})`}
                    >
                      <span className="text-[9px] font-mono font-bold truncate max-w-[110px]">{r.name || 'Rule'}</span>
                      <span className="text-[8px] font-mono opacity-80 group-hover/badge:opacity-100">({count})</span>
                    </button>
                  );
                })}
            </div>
          ) : (
            <span className="text-slate-600 font-medium">None</span>
          )}
        </div>
        <div className="text-slate-600">
        </div>
      </div>
    </div>
  );
}
