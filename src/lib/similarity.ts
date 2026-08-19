import { Entry, PromptSimilarityResult } from '../types';

/**
 * Clean and tokenize a prompt string into normalized words
 */
function tokenize(text: string): Set<string> {
  const normalized = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim();
  const words = normalized.split(/\s+/).filter(w => w.length > 1);
  return new Set(words);
}

/**
 * Calculate Jaccard similarity between two texts based on word tokens
 */
export function calculateJaccardSimilarity(textA: string, textB: string): number {
  if (!textA.trim() || !textB.trim()) return 0;
  
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);
  
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersectionCount = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersectionCount++;
    }
  }

  const unionCount = tokensA.size + tokensB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Levenshtein distance ratio for short or refined changes
 */
export function calculateLevenshteinRatio(s1: string, s2: string): number {
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();
  
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;
  
  // For long prompts, token similarity is much faster and more accurate
  if (str1.length > 500 || str2.length > 500) {
    return calculateJaccardSimilarity(str1, str2);
  }

  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return (maxLen - distance) / maxLen;
}

/**
 * Find similar entries to a given prompt string
 * @param prompt Target prompt to compare against
 * @param existingEntries List of all existing entries in database
 * @param currentEntryId Optional ID of the entry being edited to exclude itself
 * @param threshold Minimum percentage (default 75%)
 */
export function findSimilarPrompts(
  prompt: string,
  existingEntries: Entry[],
  currentEntryId?: string,
  threshold: number = 75
): PromptSimilarityResult[] {
  if (!prompt || prompt.trim().length < 10) return [];

  const results: PromptSimilarityResult[] = [];

  for (const entry of existingEntries) {
    if (currentEntryId && entry.id === currentEntryId) continue;

    // Use higher of token Jaccard similarity and character Levenshtein
    const jaccard = calculateJaccardSimilarity(prompt, entry.prompt_positive);
    const levenshtein = calculateLevenshteinRatio(prompt, entry.prompt_positive);
    const score = Math.max(jaccard, levenshtein);
    const percentage = Math.round(score * 100);

    if (percentage >= threshold) {
      results.push({
        entry,
        similarityPercentage: percentage,
      });
    }
  }

  return results.sort((a, b) => b.similarityPercentage - a.similarityPercentage);
}
