import React, { useMemo } from 'react';
import { RegexRule } from '../types';

interface InteractiveDiffProps {
  originalText: string;
  rules: RegexRule[];
}

interface MatchRange {
  start: number;
  end: number;
  ruleNames: string[];
  replacements: string[];
}

export default function InteractiveDiff({ originalText, rules }: InteractiveDiffProps) {
  // Performance threshold: Disable highlighting on giant texts to prevent lag.
  const isTooLarge = originalText.length > 12000;

  const highlightedSegments = useMemo(() => {
    if (isTooLarge || !originalText) return [];

    let ranges: MatchRange[] = [];

    // Find all matches for each rule
    for (const rule of rules) {
      if (!rule.isActive || !rule.pattern) continue;

      let flags = 'g'; // Always use global for highlighting ranges
      if (rule.flags.caseInsensitive) flags += 'i';
      if (rule.flags.multiline) flags += 'm';
      if (rule.flags.dotAll) flags += 's';

      try {
        const rx = new RegExp(rule.pattern, flags);
        let match;
        
        // Safety lock against infinite loops with regexes matching empty strings
        let lastIndex = -1;

        while ((match = rx.exec(originalText)) !== null) {
          if (rx.lastIndex === lastIndex) {
            // regex matched an empty string and didn't advance lastIndex. Force advance it to prevent infinite loop.
            rx.lastIndex++;
            continue;
          }
          lastIndex = rx.lastIndex;

          const start = match.index;
          const end = start + match[0].length;
          
          if (end > start) {
            ranges.push({
              start,
              end,
              ruleNames: [rule.name || 'Unnamed Pattern'],
              replacements: [rule.replacement !== undefined ? rule.replacement : ''],
            });
          }
        }
      } catch {
        // Skip invalid regexes
      }
    }

    if (ranges.length === 0) return [{ start: 0, end: originalText.length, isMatch: false, text: originalText, ruleNames: [], replacements: [] }];

    // Sort ranges by start index, then by end index descending
    ranges.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return b.end - a.end;
    });

    // Merge overlapping/adjacent ranges
    const mergedRanges: MatchRange[] = [];
    let current = { ...ranges[0], ruleNames: [...ranges[0].ruleNames], replacements: [...ranges[0].replacements] };

    for (let i = 1; i < ranges.length; i++) {
      const next = ranges[i];
      if (next.start <= current.end) {
        // Overlap or adjacency
        current.end = Math.max(current.end, next.end);
        // Combine names if not already present
        next.ruleNames.forEach(name => {
          if (!current.ruleNames.includes(name)) {
            current.ruleNames.push(name);
          }
        });
        next.replacements.forEach(rep => {
          if (!current.replacements.includes(rep)) {
            current.replacements.push(rep);
          }
        });
      } else {
        mergedRanges.push(current);
        current = { ...next, ruleNames: [...next.ruleNames], replacements: [...next.replacements] };
      }
    }
    mergedRanges.push(current);

    // Build segments
    const segments: { start: number; end: number; isMatch: boolean; text: string; ruleNames: string[]; replacements: string[] }[] = [];
    let lastPos = 0;

    for (const range of mergedRanges) {
      // Add unmatched text before this match
      if (range.start > lastPos) {
        segments.push({
          start: lastPos,
          end: range.start,
          isMatch: false,
          text: originalText.slice(lastPos, range.start),
          ruleNames: [],
          replacements: [],
        });
      }

      // Add matched segment
      segments.push({
        start: range.start,
        end: range.end,
        isMatch: true,
        text: originalText.slice(range.start, range.end),
        ruleNames: range.ruleNames,
        replacements: range.replacements,
      });

      lastPos = range.end;
    }

    // Add remaining unmatched text
    if (lastPos < originalText.length) {
      segments.push({
        start: lastPos,
        end: originalText.length,
        isMatch: false,
        text: originalText.slice(lastPos),
        ruleNames: [],
        replacements: [],
      });
    }

    return segments;
  }, [originalText, rules, isTooLarge]);

  if (!originalText) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 bg-[#020617] rounded border border-slate-800">
        <p className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">No original text to highlight</p>
        <p className="text-[10px] mt-1 text-slate-500 font-mono">Paste source content above to see match highlights here.</p>
      </div>
    );
  }

  if (isTooLarge) {
    return (
      <div className="p-4 bg-amber-950/20 border border-amber-900/40 rounded text-center">
        <p className="text-xs font-semibold text-amber-400">Visual highlighting disabled</p>
        <p className="text-[11px] text-amber-500 mt-1 max-w-sm mx-auto font-mono">
          The pasted text is quite large ({originalText.length.toLocaleString()} characters). Interactive highlighting is disabled to prevent typing lag and ensure peak performance.
        </p>
      </div>
    );
  }

  const matchesFound = highlightedSegments.filter((s) => s.isMatch).length;

  return (
    <div className="flex flex-col h-full bg-[#1E293B]/20 border border-slate-800 rounded-lg overflow-hidden select-none">
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 bg-[#1E293B]/60">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            Match Visualizer
            <span className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border ${
              matchesFound > 0 ? 'bg-red-950/40 text-red-400 border-red-950/50' : 'bg-[#020617] text-slate-500 border-slate-850'
            }`}>
              {matchesFound} matched region{matchesFound !== 1 && 's'}
            </span>
          </h3>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Highlights matched parts of the text</p>
        </div>
      </div>

      <div className="flex-1 p-3.5 overflow-y-auto max-h-[400px] lg:max-h-[500px]">
        <div className="whitespace-pre-wrap font-mono text-xs text-slate-300 leading-relaxed bg-[#020617] border border-slate-900 rounded p-3 min-h-[150px] max-h-[420px] overflow-y-auto break-all">
          {highlightedSegments.map((seg, idx) => {
            if (seg.isMatch) {
              const replacementText = seg.replacements && seg.replacements.join(', ');
              const replacementLabel = replacementText ? `replaced with: "${replacementText}"` : 'removed/stripped';
              return (
                <span
                  key={idx}
                  className="bg-red-950/60 text-red-300 line-through decoration-red-500/40 px-0.5 rounded-sm select-all inline hover:bg-red-950/90 transition-colors"
                  title={`Matched by: ${seg.ruleNames.join(', ')} (${replacementLabel})`}
                >
                  {seg.text}
                </span>
              );
            }
            return <React.Fragment key={idx}>{seg.text}</React.Fragment>;
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500 font-mono font-bold uppercase">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-red-950/60 border border-red-900/40 rounded-sm"></span>
            <span>Matched to replace/strip</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-slate-900 border border-slate-800 rounded-sm"></span>
            <span>Plain text (will keep)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
