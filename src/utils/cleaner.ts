import { RegexRule, CleanResult } from '../types';

/**
 * Validates whether a regex pattern string is syntactically correct.
 */
export function validateRegex(pattern: string, flagsStr: string = ''): { isValid: boolean; error?: string } {
  if (!pattern) return { isValid: true };
  try {
    new RegExp(pattern, flagsStr);
    return { isValid: true };
  } catch (err) {
    return { isValid: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Builds a RegExp object from a RegexRule.
 */
export function buildRegExp(rule: RegexRule): RegExp | null {
  if (!rule.pattern) return null;
  
  let flags = '';
  if (rule.flags.global) flags += 'g';
  if (rule.flags.caseInsensitive) flags += 'i';
  if (rule.flags.multiline) flags += 'm';
  if (rule.flags.dotAll) flags += 's';

  try {
    return new RegExp(rule.pattern, flags);
  } catch {
    return null; // Let the validation logic handle reporting
  }
}

/**
 * Counts words in a string.
 */
export function countWords(str: string): number {
  const trimmed = str.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Applies active regex rules sequentially on the input text.
 */
export function cleanText(originalText: string, rules: RegexRule[]): CleanResult {
  let currentText = originalText;
  const ruleStats: CleanResult['ruleStats'] = [];
  let totalMatchesRemoved = 0;

  for (const rule of rules) {
    const stat: CleanResult['ruleStats'][0] = {
      ruleId: rule.id,
      ruleName: rule.name || `Pattern "${rule.pattern}"`,
      pattern: rule.pattern,
      matchesRemoved: 0,
      isValid: true,
    };

    if (!rule.isActive || !rule.pattern) {
      ruleStats.push(stat);
      continue;
    }

    // Validate regex first
    let flagsStr = '';
    if (rule.flags.global) flagsStr += 'g';
    if (rule.flags.caseInsensitive) flagsStr += 'i';
    if (rule.flags.multiline) flagsStr += 'm';
    if (rule.flags.dotAll) flagsStr += 's';

    const validation = validateRegex(rule.pattern, flagsStr);
    if (!validation.isValid) {
      stat.isValid = false;
      stat.errorMsg = validation.error || 'Invalid regular expression';
      ruleStats.push(stat);
      continue;
    }

    try {
      const rx = new RegExp(rule.pattern, flagsStr);
      
      // Calculate match count
      let matchCount = 0;
      if (rx.global) {
        const matches = currentText.match(rx);
        matchCount = matches ? matches.length : 0;
      } else {
        const hasMatch = rx.test(currentText);
        matchCount = hasMatch ? 1 : 0;
      }

      // Replace matches with the specified replacement text
      const beforeLength = currentText.length;
      currentText = currentText.replace(rx, rule.replacement || '');
      const afterLength = currentText.length;

      // Note: matchesRemoved could be larger than character difference if matches are empty (like zero-width assertions)
      // or smaller if matching multi-character strings. We report matchCount as the direct match occurrences.
      stat.matchesRemoved = matchCount;
      totalMatchesRemoved += matchCount;
    } catch (err) {
      stat.isValid = false;
      stat.errorMsg = err instanceof Error ? err.message : 'Execution error';
    }

    ruleStats.push(stat);
  }

  return {
    cleanedText: currentText,
    totalMatchesRemoved,
    originalCharCount: originalText.length,
    cleanedCharCount: currentText.length,
    originalWordCount: countWords(originalText),
    cleanedWordCount: countWords(currentText),
    ruleStats,
  };
}
