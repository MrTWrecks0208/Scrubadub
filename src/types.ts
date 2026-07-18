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
