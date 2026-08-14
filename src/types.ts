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

export interface RuleColor {
  name: string;
  baseName: string;
  tier: 'vibrant' | 'pastel' | 'deep';
  bg: string;
  border: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  numClass: string;
  badgeClass: string;
  neonButtonClass: string;
}

// 17 Base Hue Definitions (Cycle 0: Vibrant Neon, Cycle 1: Pastel/Light, Cycle 2: Deep/Rich)
const HUE_SPECS = [
  {
    name: 'red',
    vibrant: { bg: 'rgba(239, 68, 68, 0.22)', border: 'rgba(239, 68, 68, 0.55)', text: 'text-red-400', bgCls: 'bg-red-500/10', bdrCls: 'border-red-500/20', num: 'border-red-500/30 text-red-400 bg-red-950/20', badge: 'bg-red-950/40 text-red-400 border-red-900/40', btn: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border-red-500/60 hover:border-red-400/80' },
    pastel: { bg: 'rgba(252, 165, 165, 0.28)', border: 'rgba(252, 165, 165, 0.70)', text: 'text-red-300', bgCls: 'bg-red-400/15', bdrCls: 'border-red-400/30', num: 'border-red-400/40 text-red-300 bg-red-900/30', badge: 'bg-red-900/40 text-red-300 border-red-700/50', btn: 'bg-red-400/15 hover:bg-red-400/25 text-red-300 hover:text-red-200 border-red-400/70 hover:border-red-300' },
    deep: { bg: 'rgba(220, 38, 38, 0.30)', border: 'rgba(220, 38, 38, 0.80)', text: 'text-red-500', bgCls: 'bg-red-600/15', bdrCls: 'border-red-600/30', num: 'border-red-600/40 text-red-500 bg-red-950/40', badge: 'bg-red-950/60 text-red-500 border-red-800/60', btn: 'bg-red-600/15 hover:bg-red-600/25 text-red-500 hover:text-red-400 border-red-600/70 hover:border-red-500' },
  },
  {
    name: 'rose',
    vibrant: { bg: 'rgba(244, 63, 94, 0.22)', border: 'rgba(244, 63, 94, 0.55)', text: 'text-rose-400', bgCls: 'bg-rose-500/10', bdrCls: 'border-rose-500/20', num: 'border-rose-500/30 text-rose-400 bg-rose-950/20', badge: 'bg-rose-950/40 text-rose-400 border-rose-900/40', btn: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border-rose-500/60 hover:border-rose-400/80' },
    pastel: { bg: 'rgba(251, 113, 133, 0.28)', border: 'rgba(251, 113, 133, 0.70)', text: 'text-rose-300', bgCls: 'bg-rose-400/15', bdrCls: 'border-rose-400/30', num: 'border-rose-400/40 text-rose-300 bg-rose-900/30', badge: 'bg-rose-900/40 text-rose-300 border-rose-700/50', btn: 'bg-rose-400/15 hover:bg-rose-400/25 text-rose-300 hover:text-rose-200 border-rose-400/70 hover:border-rose-300' },
    deep: { bg: 'rgba(225, 29, 72, 0.30)', border: 'rgba(225, 29, 72, 0.80)', text: 'text-rose-500', bgCls: 'bg-rose-600/15', bdrCls: 'border-rose-600/30', num: 'border-rose-600/40 text-rose-500 bg-rose-950/40', badge: 'bg-rose-950/60 text-rose-500 border-rose-800/60', btn: 'bg-rose-600/15 hover:bg-rose-600/25 text-rose-500 hover:text-rose-400 border-rose-600/70 hover:border-rose-500' },
  },
  {
    name: 'orange',
    vibrant: { bg: 'rgba(249, 115, 22, 0.22)', border: 'rgba(249, 115, 22, 0.55)', text: 'text-orange-400', bgCls: 'bg-orange-500/10', bdrCls: 'border-orange-500/20', num: 'border-orange-500/30 text-orange-400 bg-orange-950/20', badge: 'bg-orange-950/40 text-orange-400 border-orange-900/40', btn: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 border-orange-500/60 hover:border-orange-400/80' },
    pastel: { bg: 'rgba(253, 186, 116, 0.28)', border: 'rgba(253, 186, 116, 0.70)', text: 'text-orange-300', bgCls: 'bg-orange-400/15', bdrCls: 'border-orange-400/30', num: 'border-orange-400/40 text-orange-300 bg-orange-900/30', badge: 'bg-orange-900/40 text-orange-300 border-orange-700/50', btn: 'bg-orange-400/15 hover:bg-orange-400/25 text-orange-300 hover:text-orange-200 border-orange-400/70 hover:border-orange-300' },
    deep: { bg: 'rgba(234, 88, 12, 0.30)', border: 'rgba(234, 88, 12, 0.80)', text: 'text-orange-500', bgCls: 'bg-orange-600/15', bdrCls: 'border-orange-600/30', num: 'border-orange-600/40 text-orange-500 bg-orange-950/40', badge: 'bg-orange-950/60 text-orange-500 border-orange-800/60', btn: 'bg-orange-600/15 hover:bg-orange-600/25 text-orange-500 hover:text-orange-400 border-orange-600/70 hover:border-orange-500' },
  },
  {
    name: 'amber',
    vibrant: { bg: 'rgba(245, 158, 11, 0.22)', border: 'rgba(245, 158, 11, 0.55)', text: 'text-amber-400', bgCls: 'bg-amber-500/10', bdrCls: 'border-amber-500/20', num: 'border-amber-500/30 text-amber-400 bg-amber-950/20', badge: 'bg-[#451a03]/40 text-amber-400 border-amber-900/40', btn: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border-amber-500/60 hover:border-amber-400/80' },
    pastel: { bg: 'rgba(252, 211, 77, 0.28)', border: 'rgba(252, 211, 77, 0.70)', text: 'text-amber-300', bgCls: 'bg-amber-400/15', bdrCls: 'border-amber-400/30', num: 'border-amber-400/40 text-amber-300 bg-amber-900/30', badge: 'bg-amber-900/40 text-amber-300 border-amber-700/50', btn: 'bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 hover:text-amber-200 border-amber-400/70 hover:border-amber-300' },
    deep: { bg: 'rgba(217, 119, 6, 0.30)', border: 'rgba(217, 119, 6, 0.80)', text: 'text-amber-500', bgCls: 'bg-amber-600/15', bdrCls: 'border-amber-600/30', num: 'border-amber-600/40 text-amber-500 bg-amber-950/40', badge: 'bg-amber-950/60 text-amber-500 border-amber-800/60', btn: 'bg-amber-600/15 hover:bg-amber-600/25 text-amber-500 hover:text-amber-400 border-amber-600/70 hover:border-amber-500' },
  },
  {
    name: 'yellow',
    vibrant: { bg: 'rgba(234, 179, 8, 0.22)', border: 'rgba(234, 179, 8, 0.55)', text: 'text-yellow-400', bgCls: 'bg-yellow-500/10', bdrCls: 'border-yellow-500/20', num: 'border-yellow-500/30 text-yellow-400 bg-yellow-950/20', badge: 'bg-yellow-950/40 text-yellow-400 border-yellow-900/40', btn: 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 border-yellow-500/60 hover:border-yellow-400/80' },
    pastel: { bg: 'rgba(253, 224, 71, 0.28)', border: 'rgba(253, 224, 71, 0.70)', text: 'text-yellow-300', bgCls: 'bg-yellow-400/15', bdrCls: 'border-yellow-400/30', num: 'border-yellow-400/40 text-yellow-300 bg-yellow-900/30', badge: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50', btn: 'bg-yellow-400/15 hover:bg-yellow-400/25 text-yellow-300 hover:text-yellow-200 border-yellow-400/70 hover:border-yellow-300' },
    deep: { bg: 'rgba(202, 138, 4, 0.30)', border: 'rgba(202, 138, 4, 0.80)', text: 'text-yellow-500', bgCls: 'bg-yellow-600/15', bdrCls: 'border-yellow-600/30', num: 'border-yellow-600/40 text-yellow-500 bg-yellow-950/40', badge: 'bg-yellow-950/60 text-yellow-500 border-yellow-800/60', btn: 'bg-yellow-600/15 hover:bg-yellow-600/25 text-yellow-500 hover:text-yellow-400 border-yellow-600/70 hover:border-yellow-500' },
  },
  {
    name: 'lime',
    vibrant: { bg: 'rgba(132, 204, 22, 0.22)', border: 'rgba(132, 204, 22, 0.55)', text: 'text-lime-400', bgCls: 'bg-lime-500/10', bdrCls: 'border-lime-500/20', num: 'border-lime-500/30 text-lime-400 bg-lime-950/20', badge: 'bg-lime-950/40 text-lime-400 border-lime-900/40', btn: 'bg-lime-500/10 hover:bg-lime-500/20 text-lime-400 hover:text-lime-300 border-lime-500/60 hover:border-lime-400/80' },
    pastel: { bg: 'rgba(190, 242, 100, 0.28)', border: 'rgba(190, 242, 100, 0.70)', text: 'text-lime-300', bgCls: 'bg-lime-400/15', bdrCls: 'border-lime-400/30', num: 'border-lime-400/40 text-lime-300 bg-lime-900/30', badge: 'bg-lime-900/40 text-lime-300 border-lime-700/50', btn: 'bg-lime-400/15 hover:bg-lime-400/25 text-lime-300 hover:text-lime-200 border-lime-400/70 hover:border-lime-300' },
    deep: { bg: 'rgba(101, 163, 13, 0.30)', border: 'rgba(101, 163, 13, 0.80)', text: 'text-lime-500', bgCls: 'bg-lime-600/15', bdrCls: 'border-lime-600/30', num: 'border-lime-600/40 text-lime-500 bg-lime-950/40', badge: 'bg-lime-950/60 text-lime-500 border-lime-800/60', btn: 'bg-lime-600/15 hover:bg-lime-600/25 text-lime-500 hover:text-lime-400 border-lime-600/70 hover:border-lime-500' },
  },
  {
    name: 'green',
    vibrant: { bg: 'rgba(34, 197, 94, 0.22)', border: 'rgba(34, 197, 94, 0.55)', text: 'text-green-400', bgCls: 'bg-green-500/10', bdrCls: 'border-green-500/20', num: 'border-green-500/30 text-green-400 bg-green-950/20', badge: 'bg-green-950/40 text-green-400 border-green-900/40', btn: 'bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300 border-green-500/60 hover:border-green-400/80' },
    pastel: { bg: 'rgba(134, 239, 172, 0.28)', border: 'rgba(134, 239, 172, 0.70)', text: 'text-green-300', bgCls: 'bg-green-400/15', bdrCls: 'border-green-400/30', num: 'border-green-400/40 text-green-300 bg-green-900/30', badge: 'bg-green-900/40 text-green-300 border-green-700/50', btn: 'bg-green-400/15 hover:bg-green-400/25 text-green-300 hover:text-green-200 border-green-400/70 hover:border-green-300' },
    deep: { bg: 'rgba(22, 163, 74, 0.30)', border: 'rgba(22, 163, 74, 0.80)', text: 'text-green-500', bgCls: 'bg-green-600/15', bdrCls: 'border-green-600/30', num: 'border-green-600/40 text-green-500 bg-green-950/40', badge: 'bg-green-950/60 text-green-500 border-green-800/60', btn: 'bg-green-600/15 hover:bg-green-600/25 text-green-500 hover:text-green-400 border-green-600/70 hover:border-green-500' },
  },
  {
    name: 'emerald',
    vibrant: { bg: 'rgba(16, 185, 129, 0.22)', border: 'rgba(16, 185, 129, 0.55)', text: 'text-emerald-400', bgCls: 'bg-emerald-500/10', bdrCls: 'border-emerald-500/20', num: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20', badge: 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40', btn: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border-emerald-500/60 hover:border-emerald-400/80' },
    pastel: { bg: 'rgba(110, 231, 183, 0.28)', border: 'rgba(110, 231, 183, 0.70)', text: 'text-emerald-300', bgCls: 'bg-emerald-400/15', bdrCls: 'border-emerald-400/30', num: 'border-emerald-400/40 text-emerald-300 bg-emerald-900/30', badge: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50', btn: 'bg-emerald-400/15 hover:bg-emerald-400/25 text-emerald-300 hover:text-emerald-200 border-emerald-400/70 hover:border-emerald-300' },
    deep: { bg: 'rgba(5, 150, 105, 0.30)', border: 'rgba(5, 150, 105, 0.80)', text: 'text-emerald-500', bgCls: 'bg-emerald-600/15', bdrCls: 'border-emerald-600/30', num: 'border-emerald-600/40 text-emerald-500 bg-emerald-950/40', badge: 'bg-emerald-950/60 text-emerald-500 border-emerald-800/60', btn: 'bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-500 hover:text-emerald-400 border-emerald-600/70 hover:border-emerald-500' },
  },
  {
    name: 'teal',
    vibrant: { bg: 'rgba(20, 184, 166, 0.22)', border: 'rgba(20, 184, 166, 0.55)', text: 'text-teal-400', bgCls: 'bg-teal-500/10', bdrCls: 'border-teal-500/20', num: 'border-teal-500/30 text-teal-400 bg-teal-950/20', badge: 'bg-teal-950/40 text-teal-400 border-teal-900/40', btn: 'bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 hover:text-teal-300 border-teal-500/60 hover:border-teal-400/80' },
    pastel: { bg: 'rgba(94, 234, 212, 0.28)', border: 'rgba(94, 234, 212, 0.70)', text: 'text-teal-300', bgCls: 'bg-teal-400/15', bdrCls: 'border-teal-400/30', num: 'border-teal-400/40 text-teal-300 bg-teal-900/30', badge: 'bg-teal-900/40 text-teal-300 border-teal-700/50', btn: 'bg-teal-400/15 hover:bg-teal-400/25 text-teal-300 hover:text-teal-200 border-teal-400/70 hover:border-teal-300' },
    deep: { bg: 'rgba(13, 148, 136, 0.30)', border: 'rgba(13, 148, 136, 0.80)', text: 'text-teal-500', bgCls: 'bg-teal-600/15', bdrCls: 'border-teal-600/30', num: 'border-teal-600/40 text-teal-500 bg-teal-950/40', badge: 'bg-teal-950/60 text-teal-500 border-teal-800/60', btn: 'bg-teal-600/15 hover:bg-teal-600/25 text-teal-500 hover:text-teal-400 border-teal-600/70 hover:border-teal-500' },
  },
  {
    name: 'cyan',
    vibrant: { bg: 'rgba(6, 182, 212, 0.22)', border: 'rgba(6, 182, 212, 0.55)', text: 'text-cyan-400', bgCls: 'bg-cyan-500/10', bdrCls: 'border-cyan-500/20', num: 'border-cyan-500/30 text-cyan-400 bg-cyan-950/20', badge: 'bg-cyan-950/40 text-cyan-400 border-cyan-900/40', btn: 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border-cyan-500/60 hover:border-cyan-400/80' },
    pastel: { bg: 'rgba(103, 232, 249, 0.28)', border: 'rgba(103, 232, 249, 0.70)', text: 'text-cyan-300', bgCls: 'bg-cyan-400/15', bdrCls: 'border-cyan-400/30', num: 'border-cyan-400/40 text-cyan-300 bg-cyan-900/30', badge: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50', btn: 'bg-cyan-400/15 hover:bg-cyan-400/25 text-cyan-300 hover:text-cyan-200 border-cyan-400/70 hover:border-cyan-300' },
    deep: { bg: 'rgba(8, 145, 178, 0.30)', border: 'rgba(8, 145, 178, 0.80)', text: 'text-cyan-500', bgCls: 'bg-cyan-600/15', bdrCls: 'border-cyan-600/30', num: 'border-cyan-600/40 text-cyan-500 bg-cyan-950/40', badge: 'bg-cyan-950/60 text-cyan-500 border-cyan-800/60', btn: 'bg-cyan-600/15 hover:bg-cyan-600/25 text-cyan-500 hover:text-cyan-400 border-cyan-600/70 hover:border-cyan-500' },
  },
  {
    name: 'sky',
    vibrant: { bg: 'rgba(14, 165, 233, 0.22)', border: 'rgba(14, 165, 233, 0.55)', text: 'text-sky-400', bgCls: 'bg-sky-500/10', bdrCls: 'border-sky-500/20', num: 'border-sky-500/30 text-sky-400 bg-sky-950/20', badge: 'bg-sky-950/40 text-sky-400 border-sky-900/40', btn: 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 border-sky-500/60 hover:border-sky-400/80' },
    pastel: { bg: 'rgba(125, 211, 252, 0.28)', border: 'rgba(125, 211, 252, 0.70)', text: 'text-sky-300', bgCls: 'bg-sky-400/15', bdrCls: 'border-sky-400/30', num: 'border-sky-400/40 text-sky-300 bg-sky-900/30', badge: 'bg-sky-900/40 text-sky-300 border-sky-700/50', btn: 'bg-sky-400/15 hover:bg-sky-400/25 text-sky-300 hover:text-sky-200 border-sky-400/70 hover:border-sky-300' },
    deep: { bg: 'rgba(2, 132, 199, 0.30)', border: 'rgba(2, 132, 199, 0.80)', text: 'text-sky-500', bgCls: 'bg-sky-600/15', bdrCls: 'border-sky-600/30', num: 'border-sky-600/40 text-sky-500 bg-sky-950/40', badge: 'bg-sky-950/60 text-sky-500 border-sky-800/60', btn: 'bg-sky-600/15 hover:bg-sky-600/25 text-sky-500 hover:text-sky-400 border-sky-600/70 hover:border-sky-500' },
  },
  {
    name: 'blue',
    vibrant: { bg: 'rgba(59, 130, 246, 0.22)', border: 'rgba(59, 130, 246, 0.55)', text: 'text-blue-400', bgCls: 'bg-blue-500/10', bdrCls: 'border-blue-500/20', num: 'border-blue-500/30 text-blue-400 bg-blue-950/20', badge: 'bg-blue-950/40 text-blue-400 border-blue-900/40', btn: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border-blue-500/60 hover:border-blue-400/80' },
    pastel: { bg: 'rgba(147, 197, 253, 0.28)', border: 'rgba(147, 197, 253, 0.70)', text: 'text-blue-300', bgCls: 'bg-blue-400/15', bdrCls: 'border-blue-400/30', num: 'border-blue-400/40 text-blue-300 bg-blue-900/30', badge: 'bg-blue-900/40 text-blue-300 border-blue-700/50', btn: 'bg-blue-400/15 hover:bg-blue-400/25 text-blue-300 hover:text-blue-200 border-blue-400/70 hover:border-blue-300' },
    deep: { bg: 'rgba(37, 99, 235, 0.30)', border: 'rgba(37, 99, 235, 0.80)', text: 'text-blue-500', bgCls: 'bg-blue-600/15', bdrCls: 'border-blue-600/30', num: 'border-blue-600/40 text-blue-500 bg-blue-950/40', badge: 'bg-blue-950/60 text-blue-500 border-blue-800/60', btn: 'bg-blue-600/15 hover:bg-blue-600/25 text-blue-500 hover:text-blue-400 border-blue-600/70 hover:border-blue-500' },
  },
  {
    name: 'indigo',
    vibrant: { bg: 'rgba(99, 102, 241, 0.22)', border: 'rgba(99, 102, 241, 0.55)', text: 'text-indigo-400', bgCls: 'bg-indigo-500/10', bdrCls: 'border-indigo-500/20', num: 'border-indigo-500/30 text-indigo-400 bg-indigo-950/20', badge: 'bg-indigo-950/40 text-indigo-400 border-indigo-900/40', btn: 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border-indigo-500/60 hover:border-indigo-400/80' },
    pastel: { bg: 'rgba(165, 180, 252, 0.28)', border: 'rgba(165, 180, 252, 0.70)', text: 'text-indigo-300', bgCls: 'bg-indigo-400/15', bdrCls: 'border-indigo-400/30', num: 'border-indigo-400/40 text-indigo-300 bg-indigo-900/30', badge: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/50', btn: 'bg-indigo-400/15 hover:bg-indigo-400/25 text-indigo-300 hover:text-indigo-200 border-indigo-400/70 hover:border-indigo-300' },
    deep: { bg: 'rgba(79, 70, 229, 0.30)', border: 'rgba(79, 70, 229, 0.80)', text: 'text-indigo-500', bgCls: 'bg-indigo-600/15', bdrCls: 'border-indigo-600/30', num: 'border-indigo-600/40 text-indigo-500 bg-indigo-950/40', badge: 'bg-indigo-950/60 text-indigo-500 border-indigo-800/60', btn: 'bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-500 hover:text-indigo-400 border-indigo-600/70 hover:border-indigo-500' },
  },
  {
    name: 'violet',
    vibrant: { bg: 'rgba(139, 92, 246, 0.22)', border: 'rgba(139, 92, 246, 0.55)', text: 'text-violet-400', bgCls: 'bg-violet-500/10', bdrCls: 'border-violet-500/20', num: 'border-violet-500/30 text-violet-400 bg-violet-950/20', badge: 'bg-violet-950/40 text-violet-400 border-violet-900/40', btn: 'bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 hover:text-violet-300 border-violet-500/60 hover:border-violet-400/80' },
    pastel: { bg: 'rgba(196, 181, 253, 0.28)', border: 'rgba(196, 181, 253, 0.70)', text: 'text-violet-300', bgCls: 'bg-violet-400/15', bdrCls: 'border-violet-400/30', num: 'border-violet-400/40 text-violet-300 bg-violet-900/30', badge: 'bg-violet-900/40 text-violet-300 border-violet-700/50', btn: 'bg-violet-400/15 hover:bg-violet-400/25 text-violet-300 hover:text-violet-200 border-violet-400/70 hover:border-violet-300' },
    deep: { bg: 'rgba(124, 58, 237, 0.30)', border: 'rgba(124, 58, 237, 0.80)', text: 'text-violet-500', bgCls: 'bg-violet-600/15', bdrCls: 'border-violet-600/30', num: 'border-violet-600/40 text-violet-500 bg-violet-950/40', badge: 'bg-violet-950/60 text-violet-500 border-violet-800/60', btn: 'bg-violet-600/15 hover:bg-violet-600/25 text-violet-500 hover:text-violet-400 border-violet-600/70 hover:border-violet-500' },
  },
  {
    name: 'purple',
    vibrant: { bg: 'rgba(168, 85, 247, 0.22)', border: 'rgba(168, 85, 247, 0.55)', text: 'text-purple-400', bgCls: 'bg-purple-500/10', bdrCls: 'border-purple-500/20', num: 'border-purple-500/30 text-purple-400 bg-purple-950/20', badge: 'bg-purple-950/40 text-purple-400 border-purple-900/40', btn: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 border-purple-500/60 hover:border-purple-400/80' },
    pastel: { bg: 'rgba(216, 180, 254, 0.28)', border: 'rgba(216, 180, 254, 0.70)', text: 'text-purple-300', bgCls: 'bg-purple-400/15', bdrCls: 'border-purple-400/30', num: 'border-purple-400/40 text-purple-300 bg-purple-900/30', badge: 'bg-purple-900/40 text-purple-300 border-purple-700/50', btn: 'bg-purple-400/15 hover:bg-purple-400/25 text-purple-300 hover:text-purple-200 border-purple-400/70 hover:border-purple-300' },
    deep: { bg: 'rgba(147, 51, 234, 0.30)', border: 'rgba(147, 51, 234, 0.80)', text: 'text-purple-500', bgCls: 'bg-purple-600/15', bdrCls: 'border-purple-600/30', num: 'border-purple-600/40 text-purple-500 bg-purple-950/40', badge: 'bg-purple-950/60 text-purple-500 border-purple-800/60', btn: 'bg-purple-600/15 hover:bg-purple-600/25 text-purple-500 hover:text-purple-400 border-purple-600/70 hover:border-purple-500' },
  },
  {
    name: 'fuchsia',
    vibrant: { bg: 'rgba(217, 70, 239, 0.22)', border: 'rgba(217, 70, 239, 0.55)', text: 'text-fuchsia-400', bgCls: 'bg-fuchsia-500/10', bdrCls: 'border-fuchsia-500/20', num: 'border-fuchsia-500/30 text-fuchsia-400 bg-fuchsia-950/20', badge: 'bg-fuchsia-950/40 text-fuchsia-400 border-fuchsia-900/40', btn: 'bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 hover:text-fuchsia-300 border-fuchsia-500/60 hover:border-fuchsia-400/80' },
    pastel: { bg: 'rgba(240, 171, 252, 0.28)', border: 'rgba(240, 171, 252, 0.70)', text: 'text-fuchsia-300', bgCls: 'bg-fuchsia-400/15', bdrCls: 'border-fuchsia-400/30', num: 'border-fuchsia-400/40 text-fuchsia-300 bg-fuchsia-900/30', badge: 'bg-fuchsia-900/40 text-fuchsia-300 border-fuchsia-700/50', btn: 'bg-fuchsia-400/15 hover:bg-fuchsia-400/25 text-fuchsia-300 hover:text-fuchsia-200 border-fuchsia-400/70 hover:border-fuchsia-300' },
    deep: { bg: 'rgba(192, 38, 211, 0.30)', border: 'rgba(192, 38, 211, 0.80)', text: 'text-fuchsia-500', bgCls: 'bg-fuchsia-600/15', bdrCls: 'border-fuchsia-600/30', num: 'border-fuchsia-600/40 text-fuchsia-500 bg-fuchsia-950/40', badge: 'bg-fuchsia-950/60 text-fuchsia-500 border-fuchsia-800/60', btn: 'bg-fuchsia-600/15 hover:bg-fuchsia-600/25 text-fuchsia-500 hover:text-fuchsia-400 border-fuchsia-600/70 hover:border-fuchsia-500' },
  },
  {
    name: 'pink',
    vibrant: { bg: 'rgba(236, 72, 153, 0.22)', border: 'rgba(236, 72, 153, 0.55)', text: 'text-pink-400', bgCls: 'bg-pink-500/10', bdrCls: 'border-pink-500/20', num: 'border-pink-500/30 text-pink-400 bg-pink-950/20', badge: 'bg-pink-950/40 text-pink-400 border-pink-900/40', btn: 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 hover:text-pink-300 border-pink-500/60 hover:border-pink-400/80' },
    pastel: { bg: 'rgba(249, 168, 212, 0.28)', border: 'rgba(249, 168, 212, 0.70)', text: 'text-pink-300', bgCls: 'bg-pink-400/15', bdrCls: 'border-pink-400/30', num: 'border-pink-400/40 text-pink-300 bg-pink-900/30', badge: 'bg-pink-900/40 text-pink-300 border-pink-700/50', btn: 'bg-pink-400/15 hover:bg-pink-400/25 text-pink-300 hover:text-pink-200 border-pink-400/70 hover:border-pink-300' },
    deep: { bg: 'rgba(219, 39, 119, 0.30)', border: 'rgba(219, 39, 119, 0.80)', text: 'text-pink-500', bgCls: 'bg-pink-600/15', bdrCls: 'border-pink-600/30', num: 'border-pink-600/40 text-pink-500 bg-pink-950/40', badge: 'bg-pink-950/60 text-pink-500 border-pink-800/60', btn: 'bg-pink-600/15 hover:bg-pink-600/25 text-pink-500 hover:text-pink-400 border-pink-600/70 hover:border-pink-500' },
  }
];

// Helper to create RuleColor from spec
function createRuleColor(hueSpec: typeof HUE_SPECS[0], tier: 'vibrant' | 'pastel' | 'deep'): RuleColor {
  const spec = hueSpec[tier];
  return {
    name: tier === 'vibrant' ? hueSpec.name : `${hueSpec.name}-${tier}`,
    baseName: hueSpec.name,
    tier,
    bg: spec.bg,
    border: spec.border,
    textClass: spec.text,
    bgClass: spec.bgCls,
    borderClass: spec.bdrCls,
    numClass: spec.num,
    badgeClass: spec.badge,
    neonButtonClass: spec.btn,
  };
}

// Generate full multi-tier palettes
const TIERS: ('vibrant' | 'pastel' | 'deep')[] = ['vibrant', 'pastel', 'deep'];

export const HIGHLIGHT_COLORS: RuleColor[] = HUE_SPECS.map(h => createRuleColor(h, 'vibrant'));

export function getRuleColor(index: number): RuleColor {
  const tierIndex = Math.floor(index / HUE_SPECS.length) % TIERS.length;
  const hueIndex = index % HUE_SPECS.length;
  const tier = TIERS[tierIndex];
  return createRuleColor(HUE_SPECS[hueIndex], tier);
}

export function getStableRuleColor(ruleId: string, rulesList?: { id: string }[]): RuleColor {
  if (rulesList && rulesList.length > 0) {
    const idx = rulesList.findIndex(r => r.id === ruleId);
    if (idx !== -1) {
      return getRuleColor(idx);
    }
  }
  let hash = 0;
  for (let i = 0; i < ruleId.length; i++) {
    hash = ruleId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const rawIdx = Math.abs(hash);
  return getRuleColor(rawIdx);
}


