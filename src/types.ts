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
    name: 'amber',
    bg: 'rgba(245, 158, 11, 0.22)',
    border: 'rgba(245, 158, 11, 0.55)',
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/20',
    numClass: 'border-amber-500/30 text-amber-400 bg-amber-950/20',
    badgeClass: 'bg-[#451a03]/40 text-amber-400 border-amber-900/40'
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
  },
  {
    name: 'green',
    bg: 'rgba(34, 197, 94, 0.22)',
    border: 'rgba(34, 197, 94, 0.55)',
    textClass: 'text-green-400',
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/20',
    numClass: 'border-green-500/30 text-green-400 bg-green-950/20',
    badgeClass: 'bg-green-950/40 text-green-400 border-green-900/40'
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
    name: 'teal',
    bg: 'rgba(20, 184, 166, 0.22)',
    border: 'rgba(20, 184, 166, 0.55)',
    textClass: 'text-teal-400',
    bgClass: 'bg-teal-500/10',
    borderClass: 'border-teal-500/20',
    numClass: 'border-teal-500/30 text-teal-400 bg-teal-950/20',
    badgeClass: 'bg-teal-950/40 text-teal-400 border-teal-900/40'
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
    name: 'blue',
    bg: 'rgba(59, 130, 246, 0.22)',
    border: 'rgba(59, 130, 246, 0.55)',
    textClass: 'text-blue-400',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/20',
    numClass: 'border-blue-500/30 text-blue-400 bg-blue-950/20',
    badgeClass: 'bg-blue-950/40 text-blue-400 border-blue-900/40'
  },
  {
    name: 'indigo',
    bg: 'rgba(99, 102, 241, 0.22)',
    border: 'rgba(99, 102, 241, 0.55)',
    textClass: 'text-indigo-400',
    bgClass: 'bg-indigo-500/10',
    borderClass: 'border-indigo-500/20',
    numClass: 'border-indigo-500/30 text-indigo-400 bg-indigo-950/20',
    badgeClass: 'bg-indigo-950/40 text-indigo-400 border-indigo-900/40'
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
    name: 'purple',
    bg: 'rgba(168, 85, 247, 0.22)',
    border: 'rgba(168, 85, 247, 0.55)',
    textClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/20',
    numClass: 'border-purple-500/30 text-purple-400 bg-purple-950/20',
    badgeClass: 'bg-purple-950/40 text-purple-400 border-purple-900/40'
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
    name: 'pink',
    bg: 'rgba(236, 72, 153, 0.22)',
    border: 'rgba(236, 72, 153, 0.55)',
    textClass: 'text-pink-400',
    bgClass: 'bg-pink-500/10',
    borderClass: 'border-pink-500/20',
    numClass: 'border-pink-500/30 text-pink-400 bg-pink-950/20',
    badgeClass: 'bg-pink-950/40 text-pink-400 border-pink-900/40'
  }
];

export function getRuleColor(index: number) {
  return HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length];
}

export function getStableRuleColor(ruleId: string, rulesList?: { id: string }[]) {
  if (rulesList) {
    const idx = rulesList.findIndex(r => r.id === ruleId);
    if (idx !== -1) {
      return HIGHLIGHT_COLORS[idx % HIGHLIGHT_COLORS.length];
    }
  }
  let hash = 0;
  for (let i = 0; i < ruleId.length; i++) {
    hash = ruleId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % HIGHLIGHT_COLORS.length;
  return HIGHLIGHT_COLORS[index];
}

