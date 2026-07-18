import React, { useMemo, useRef, useEffect } from 'react';
import { RegexRule } from '../types';

interface HighlightedTextareaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rules: RegexRule[];
}

interface MatchRange {
  start: number;
  end: number;
  ruleNames: string[];
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
      return [{ isMatch: false, text: value || '', ruleNames: [] }];
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
            ruleNames: [rule.name || 'Pattern'],
          });
        }
      } catch (e) {
        // Ignore invalid regexes during typing
      }
    }

    if (ranges.length === 0) {
      return [{ isMatch: false, text: value, ruleNames: [] }];
    }

    // Sort and merge overlapping ranges
    ranges.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return b.end - a.end;
    });

    const mergedRanges: MatchRange[] = [];
    let current = { ...ranges[0], ruleNames: [...ranges[0].ruleNames] };

    for (let i = 1; i < ranges.length; i++) {
      const next = ranges[i];
      if (next.start < current.end) {
        if (next.end > current.end) {
          current.end = next.end;
        }
        next.ruleNames.forEach(name => {
          if (!current.ruleNames.includes(name)) {
            current.ruleNames.push(name);
          }
        });
      } else {
        mergedRanges.push(current);
        current = { ...next, ruleNames: [...next.ruleNames] };
      }
    }
    mergedRanges.push(current);

    // Build segment elements
    const segments: { isMatch: boolean; text: string; ruleNames: string[] }[] = [];
    let lastPos = 0;

    for (const range of mergedRanges) {
      if (range.start > lastPos) {
        segments.push({
          isMatch: false,
          text: value.slice(lastPos, range.start),
          ruleNames: [],
        });
      }

      segments.push({
        isMatch: true,
        text: value.slice(range.start, range.end),
        ruleNames: range.ruleNames,
      });

      lastPos = range.end;
    }

    if (lastPos < value.length) {
      segments.push({
        isMatch: false,
        text: value.slice(lastPos),
        ruleNames: [],
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
          background-color: rgba(245, 158, 11, 0.25) !important;
          color: transparent !important;
          border-bottom: 1.5px solid rgba(245, 158, 11, 0.5) !important;
          border-radius: 2px !important;
          padding: 0 !important;
          margin: 0 !important;
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
              return (
                <mark key={idx}>
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
      <div className="flex items-center justify-between text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-amber-500/20 border border-amber-500/40 rounded-sm"></span>
          <span>Matched Regions ({activeMatchesCount})</span>
        </div>
        <div className="text-slate-600">
          Highlights update live as you type
        </div>
      </div>
    </div>
  );
}
