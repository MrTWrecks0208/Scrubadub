export interface RegexRule {
  id: string;
  pattern: string;
  replacement: string;
  flags: {
    global: boolean;
    caseInsensitive: boolean;
    multiline: boolean;
    dotAll: boolean;
  };
  isActive: boolean;
  name: string;
}

export interface RegexPreset {
  id: string;
  name: string;
  description: string;
  rules: RegexRule[];
  sampleText: string;
}

export interface CleanResult {
  cleanedText: string;
  totalMatchesRemoved: number;
  originalCharCount: number;
  cleanedCharCount: number;
  originalWordCount: number;
  cleanedWordCount: number;
  ruleStats: {
    ruleId: string;
    ruleName: string;
    pattern: string;
    matchesRemoved: number;
    isValid: boolean;
    errorMsg?: string;
  }[];
}

export const HIGHLIGHT_COLORS = [
  {
    name: 'rose',
    bg: 'rgba(244, 63, 94, 0.22)',
    border: 'rgba(244, 63, 94, 0.55)',
    textClass: 'text-rose-400',
    bgClass: 'bg-rose-500/10',
    borderClass: 'border-rose-500/20',
    numClass: 'border-rose-500/30 text-rose-400 bg-rose-950/20',
    badgeClass: 'bg-rose-950/40 text-rose-400 border-rose-900/40'
  },
  {
    name: 'amber',
    bg: 'rgba(245, 158, 11, 0.22)',
    border: 'rgba(245, 158, 11, 0.55)',
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/20',
    numClass: 'border-amber-500/30 text-amber-400 bg-amber-950/20',
    badgeClass: 'bg-amber-950/40 text-amber-400 border-amber-900/40'
  },
  {
    name: 'sky',
    bg: 'rgba(14, 165, 233, 0.22)',
    border: 'rgba(14, 165, 233, 0.55)',
    textClass: 'text-sky-400',
    bgClass: 'bg-sky-500/10',
    borderClass: 'border-sky-500/20',
    numClass: 'border-sky-500/30 text-sky-400 bg-sky-950/20',
    badgeClass: 'bg-sky-950/40 text-sky-400 border-sky-900/40'
  },
  {
    name: 'emerald',
    bg: 'rgba(16, 185, 129, 0.22)',
    border: 'rgba(16, 185, 129, 0.55)',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/20',
    numClass: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20',
    badgeClass: 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40'
  },
  {
    name: 'violet',
    bg: 'rgba(139, 92, 246, 0.22)',
    border: 'rgba(139, 92, 246, 0.55)',
    textClass: 'text-violet-400',
    bgClass: 'bg-violet-500/10',
    borderClass: 'border-violet-500/20',
    numClass: 'border-violet-500/30 text-violet-400 bg-violet-950/20',
    badgeClass: 'bg-violet-950/40 text-violet-400 border-violet-900/40'
  },
  {
    name: 'fuchsia',
    bg: 'rgba(217, 70, 239, 0.22)',
    border: 'rgba(217, 70, 239, 0.55)',
    textClass: 'text-fuchsia-400',
    bgClass: 'bg-fuchsia-500/10',
    borderClass: 'border-fuchsia-500/20',
    numClass: 'border-fuchsia-500/30 text-fuchsia-400 bg-fuchsia-950/20',
    badgeClass: 'bg-fuchsia-950/40 text-fuchsia-400 border-fuchsia-900/40'
  },
  {
    name: 'orange',
    bg: 'rgba(249, 115, 22, 0.22)',
    border: 'rgba(249, 115, 22, 0.55)',
    textClass: 'text-orange-400',
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/20',
    numClass: 'border-orange-500/30 text-orange-400 bg-orange-950/20',
    badgeClass: 'bg-orange-950/40 text-orange-400 border-orange-900/40'
  },
  {
    name: 'cyan',
    bg: 'rgba(6, 182, 212, 0.22)',
    border: 'rgba(6, 182, 212, 0.55)',
    textClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/10',
    borderClass: 'border-cyan-500/20',
    numClass: 'border-cyan-500/30 text-cyan-400 bg-cyan-950/20',
    badgeClass: 'bg-cyan-950/40 text-cyan-400 border-cyan-900/40'
  },
  {
    name: 'pink',
    bg: 'rgba(236, 72, 153, 0.22)',
    border: 'rgba(236, 72, 153, 0.55)',
    textClass: 'text-pink-400',
    bgClass: 'bg-pink-500/10',
    borderClass: 'border-pink-500/20',
    numClass: 'border-pink-500/30 text-pink-400 bg-pink-950/20',
    badgeClass: 'bg-pink-950/40 text-pink-400 border-pink-900/40'
  },
  {
    name: 'lime',
    bg: 'rgba(132, 204, 22, 0.22)',
    border: 'rgba(132, 204, 22, 0.55)',
    textClass: 'text-lime-400',
    bgClass: 'bg-lime-500/10',
    borderClass: 'border-lime-500/20',
    numClass: 'border-lime-500/30 text-lime-400 bg-lime-950/20',
    badgeClass: 'bg-lime-950/40 text-lime-400 border-lime-900/40'
  }
];

export function getRuleColor(index: number) {
  return HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length];
}

