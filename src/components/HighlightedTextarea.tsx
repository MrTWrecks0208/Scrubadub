import React, { useMemo, useRef, useEffect } from 'react';
import { RegexRule, HIGHLIGHT_COLORS } from '../types';

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
    const segments: { isMatch: boolean; text: string; ruleIds: string[] }[] = [];
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
        .sync-text-styles mark.highlight-amber {
          background-color: rgba(245, 158, 11, 0.22) !important;
          border-bottom: 1.5px solid rgba(245, 158, 11, 0.55) !important;
        }
        .sync-text-styles mark.highlight-sky {
          background-color: rgba(14, 165, 233, 0.22) !important;
          border-bottom: 1.5px solid rgba(14, 165, 233, 0.55) !important;
        }
        .sync-text-styles mark.highlight-emerald {
          background-color: rgba(16, 185, 129, 0.22) !important;
          border-bottom: 1.5px solid rgba(16, 185, 129, 0.55) !important;
        }
        .sync-text-styles mark.highlight-violet {
          background-color: rgba(139, 92, 246, 0.22) !important;
          border-bottom: 1.5px solid rgba(139, 92, 246, 0.55) !important;
        }
        .sync-text-styles mark.highlight-fuchsia {
          background-color: rgba(217, 70, 239, 0.22) !important;
          border-bottom: 1.5px solid rgba(217, 70, 239, 0.55) !important;
        }
        .sync-text-styles mark.highlight-orange {
          background-color: rgba(249, 115, 22, 0.22) !important;
          border-bottom: 1.5px solid rgba(249, 115, 22, 0.55) !important;
        }
        .sync-text-styles mark.highlight-cyan {
          background-color: rgba(6, 182, 212, 0.22) !important;
          border-bottom: 1.5px solid rgba(6, 182, 212, 0.55) !important;
        }
        .sync-text-styles mark.highlight-pink {
          background-color: rgba(236, 72, 153, 0.22) !important;
          border-bottom: 1.5px solid rgba(236, 72, 153, 0.55) !important;
        }
        .sync-text-styles mark.highlight-lime {
          background-color: rgba(132, 204, 22, 0.22) !important;
          border-bottom: 1.5px solid rgba(132, 204, 22, 0.55) !important;
        }

        .indicator-rose {
          background-color: rgba(244, 63, 94, 0.22) !important;
          border-color: rgba(244, 63, 94, 0.55) !important;
        }
        .indicator-amber {
          background-color: rgba(245, 158, 11, 0.22) !important;
          border-color: rgba(245, 158, 11, 0.55) !important;
        }
        .indicator-sky {
          background-color: rgba(14, 165, 233, 0.22) !important;
          border-color: rgba(14, 165, 233, 0.55) !important;
        }
        .indicator-emerald {
          background-color: rgba(16, 185, 129, 0.22) !important;
          border-color: rgba(16, 185, 129, 0.55) !important;
        }
        .indicator-violet {
          background-color: rgba(139, 92, 246, 0.22) !important;
          border-color: rgba(139, 92, 246, 0.55) !important;
        }
        .indicator-fuchsia {
          background-color: rgba(217, 70, 239, 0.22) !important;
          border-color: rgba(217, 70, 239, 0.55) !important;
        }
        .indicator-orange {
          background-color: rgba(249, 115, 22, 0.22) !important;
          border-color: rgba(249, 115, 22, 0.55) !important;
        }
        .indicator-cyan {
          background-color: rgba(6, 182, 212, 0.22) !important;
          border-color: rgba(6, 182, 212, 0.55) !important;
        }
        .indicator-pink {
          background-color: rgba(236, 72, 153, 0.22) !important;
          border-color: rgba(236, 72, 153, 0.55) !important;
        }
        .indicator-lime {
          background-color: rgba(132, 204, 22, 0.22) !important;
          border-color: rgba(132, 204, 22, 0.55) !important;
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
              const ruleIdx = rules.findIndex((r) => r.id === firstRuleId);
              const colorName = ruleIdx !== -1 ? HIGHLIGHT_COLORS[ruleIdx % HIGHLIGHT_COLORS.length].name : 'amber';
              return (
                <mark key={idx} className={`highlight-${colorName}`}>
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
                  const rIdx = rules.findIndex(rule => rule.id === r.id);
                  const color = HIGHLIGHT_COLORS[rIdx % HIGHLIGHT_COLORS.length];
                  return (
                    <div key={r.id} className="flex items-center gap-1 bg-[#1E293B]/40 px-1 py-0.5 rounded border border-slate-800">
                      <span className={`w-1.5 h-1.5 rounded-xs border indicator-${color.name}`}></span>
                      <span className="text-[8px] text-slate-400 font-mono truncate max-w-[80px]">{r.name || 'Rule'}</span>
                    </div>
                  );
                })}
            </div>
          ) : (
            <span className="text-slate-600 font-medium">None</span>
          )}
        </div>
        <div className="text-slate-600">
          Highlights update live
        </div>
      </div>
    </div>
  );
}
