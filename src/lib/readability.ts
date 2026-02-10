/**
 * Client-side readability analysis for editor Insights tab.
 * No AI calls needed — all computed locally.
 */

// ─── Stop words ───
const STOP_WORDS = new Set([
  "a","about","above","after","again","against","all","am","an","and","any","are",
  "aren't","as","at","be","because","been","before","being","below","between","both",
  "but","by","can","can't","cannot","could","couldn't","did","didn't","do","does",
  "doesn't","doing","don't","down","during","each","few","for","from","further",
  "get","got","had","hadn't","has","hasn't","have","haven't","having","he","he'd",
  "he'll","he's","her","here","here's","hers","herself","him","himself","his","how",
  "how's","i","i'd","i'll","i'm","i've","if","in","into","is","isn't","it","it's",
  "its","itself","just","let's","me","might","more","most","mustn't","my","myself",
  "no","nor","not","of","off","on","once","only","or","other","ought","our","ours",
  "ourselves","out","over","own","really","same","shan't","she","she'd","she'll",
  "she's","should","shouldn't","so","some","such","than","that","that's","the",
  "their","theirs","them","themselves","then","there","there's","these","they",
  "they'd","they'll","they're","they've","this","those","through","to","too",
  "under","until","up","upon","us","very","was","wasn't","we","we'd","we'll",
  "we're","we've","were","weren't","what","what's","when","when's","where",
  "where's","which","while","who","who's","whom","why","why's","will","with",
  "won't","would","wouldn't","you","you'd","you'll","you're","you've","your",
  "yours","yourself","yourselves","also","like","one","two","new","use","used",
  "using","well","even","still","way","many","may","said","now","much","make",
  "made","since","back","going","come","take","long","first","last","think",
  "good","know","see","want","look","say","go","need","work","call","try",
  "ask","tell","put","give","keep","find","thing","things","something","anything",
  "nothing","everything",
]);

// ─── Helpers ───

/** Strip HTML tags and decode basic entities */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split text into sentences (basic heuristic) */
function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Split text into words */
function splitWords(text: string): string[] {
  return text
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

/** Count syllables in a word (English approximation) */
function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;

  let count = 0;
  const vowels = "aeiouy";
  let prevVowel = false;

  for (let i = 0; i < w.length; i++) {
    const isVowel = vowels.includes(w[i]);
    if (isVowel && !prevVowel) {
      count++;
    }
    prevVowel = isVowel;
  }

  // Adjust for silent 'e' at end
  if (w.endsWith("e") && count > 1) count--;
  // Words like "le" at end
  if (w.endsWith("le") && w.length > 2 && !vowels.includes(w[w.length - 3])) count++;

  return Math.max(1, count);
}

// ─── Public API ───

/**
 * Calculate Flesch-Kincaid Grade Level.
 * Returns a U.S. school grade level (e.g., 8 = 8th grade).
 */
export function calculateFleschKincaid(text: string): number {
  const words = splitWords(text);
  const sentences = splitSentences(text);

  if (words.length === 0 || sentences.length === 0) return 0;

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = totalSyllables / words.length;

  // Flesch-Kincaid Grade Level formula
  const grade =
    0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

  return Math.max(0, Math.round(grade * 10) / 10);
}

/**
 * Calculate Flesch Reading Ease score (0-100).
 * Higher = easier to read. 60-70 is ideal for newsletters.
 */
export function calculateReadingEase(text: string): number {
  const words = splitWords(text);
  const sentences = splitSentences(text);

  if (words.length === 0 || sentences.length === 0) return 0;

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = totalSyllables / words.length;

  // Flesch Reading Ease formula
  const ease =
    206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  return Math.max(0, Math.min(100, Math.round(ease * 10) / 10));
}

/**
 * Extract top keywords by frequency, excluding stop words.
 */
export function extractKeywords(
  text: string,
  limit = 5,
): { word: string; count: number }[] {
  const words = splitWords(text.toLowerCase());
  const freq = new Map<string, number>();

  for (const raw of words) {
    const w = raw.replace(/[^a-z0-9'-]/g, "");
    if (w.length < 3 || STOP_WORDS.has(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

/**
 * Sentence-level statistics.
 */
export function sentenceStats(text: string): { count: number; avgLength: number } {
  const sentences = splitSentences(text);
  const words = sentences.map((s) => splitWords(s).length);
  const total = words.reduce((a, b) => a + b, 0);
  return {
    count: sentences.length,
    avgLength: sentences.length > 0 ? Math.round(total / sentences.length) : 0,
  };
}

/**
 * Paragraph-level statistics from HTML content.
 */
export function paragraphStats(html: string): { count: number; avgLength: number } {
  // Split by paragraph tags or double newlines
  const paragraphs = html
    .split(/<\/p>|<br\s*\/?>\s*<br\s*\/?>|\n\n/)
    .map((p) => stripHtml(p).trim())
    .filter((p) => p.length > 0);

  const wordCounts = paragraphs.map((p) => splitWords(p).length);
  const total = wordCounts.reduce((a, b) => a + b, 0);

  return {
    count: paragraphs.length,
    avgLength: paragraphs.length > 0 ? Math.round(total / paragraphs.length) : 0,
  };
}

/**
 * Get a reading level label from grade level.
 */
export function getReadingLevelLabel(grade: number): string {
  if (grade <= 5) return "Very Easy";
  if (grade <= 7) return "Easy";
  if (grade <= 9) return "Average";
  if (grade <= 12) return "Fairly Difficult";
  if (grade <= 16) return "Difficult";
  return "Very Difficult";
}

/**
 * Get reading level color class for UI.
 */
export function getReadingLevelColor(grade: number): string {
  if (grade <= 7) return "text-emerald-400";
  if (grade <= 9) return "text-amber-400";
  if (grade <= 12) return "text-orange-400";
  return "text-red-400";
}

/**
 * Compute all readability metrics at once from HTML content.
 */
export function analyzeContent(html: string) {
  const plainText = stripHtml(html);
  const words = splitWords(plainText);
  const grade = calculateFleschKincaid(plainText);
  const ease = calculateReadingEase(plainText);
  const keywords = extractKeywords(plainText, 5);
  const sentences = sentenceStats(plainText);
  const paragraphs = paragraphStats(html);

  return {
    wordCount: words.length,
    characterCount: plainText.length,
    grade,
    ease,
    readingLevel: getReadingLevelLabel(grade),
    readingLevelColor: getReadingLevelColor(grade),
    keywords,
    sentences,
    paragraphs,
    readingTime: Math.max(1, Math.ceil(words.length / 238)),
  };
}
