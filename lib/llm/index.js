/**
 * LLM Pipeline — More-of-Less Studio text inference layer.
 * All calls route through the free NVIDIA NIM proxy.
 *
 * Exports:
 *   analyzeLyrics(lyrics)          → structured JSON
 *   generateScenePrompt(section)   → cinematic video prompt string
 *   generateCharacterPassport(desc)→ character JSON
 *   generateScenePromptBatch(sections) → string[]
 */

import NIMAdapter from '../gateway/adapters/NIMAdapter.js';

// Singleton NIM client
const nim = new NIMAdapter();

// ── In-memory character passport cache ──────────────────────────────────────
const passportCache = new Map();

// ── Lyrics Analyzer ─────────────────────────────────────────────────────────

const LYRICS_SYSTEM = `You are a music video director analyzing a song for visual production.
Return ONLY valid JSON — no markdown, no explanation, no code fences.`;

const LYRICS_TEMPLATE = (lyrics) => `Lyrics:
${lyrics}

Analyze and return JSON:
{
  "overall_mood": "one word",
  "energy_arc": "description of how energy changes verse to chorus",
  "bpm_estimate": number,
  "sections": [
    {
      "name": "verse 1",
      "start_seconds": 0,
      "end_seconds": 45,
      "mood": "...",
      "energy": "low|medium|high",
      "key_visual_themes": ["theme1", "theme2"],
      "suggested_camera": "static|handheld|drone|dolly"
    }
  ],
  "color_palette": ["#hex1", "#hex2", "#hex3"],
  "recommended_style": "cinematic description"
}`;

/**
 * Analyze song lyrics into structured production data.
 * @param {string} lyrics - Full song lyrics
 * @returns {Promise<object>} Structured lyrics analysis
 */
export async function analyzeLyrics(lyrics) {
  if (!lyrics?.trim()) throw new Error('lyrics is required');

  const text = await nim.chat(
    [
      { role: 'system', content: LYRICS_SYSTEM },
      { role: 'user', content: LYRICS_TEMPLATE(lyrics) },
    ],
    { maxTokens: 1500, temperature: 0.3 }
  );

  return parseJSON(text, 'lyrics analysis');
}

// ── Scene Prompt Generator ───────────────────────────────────────────────────

const SCENE_SYSTEM = `You are a cinematographer generating video prompts for AI video generation.
Output only the prompt text — no JSON, no explanation, no preamble.`;

const SCENE_TEMPLATE = ({ sectionName, startTime, endTime, lyrics, bpm, mood, energy }) =>
  `Song section: ${sectionName} (${startTime}s - ${endTime}s)
Lyrics snippet: ${lyrics || '(instrumental)'}
BPM: ${bpm || 'unknown'}
Mood: ${mood}
Energy level: ${energy}

Generate a cinematic video prompt (max 150 words) for this section.
Include: camera angle, movement, lighting, environment, character action.
Match the energy and mood of the lyrics exactly.`;

/**
 * Generate a single cinematic scene prompt for one song section.
 * @param {object} section - { sectionName, startTime, endTime, lyrics, bpm, mood, energy }
 * @returns {Promise<string>} Cinematic video prompt
 */
export async function generateScenePrompt(section) {
  const text = await nim.chat(
    [
      { role: 'system', content: SCENE_SYSTEM },
      { role: 'user', content: SCENE_TEMPLATE(section) },
    ],
    { maxTokens: 300, temperature: 0.8 }
  );
  return text.trim();
}

/**
 * Generate scene prompts for multiple sections (rate-limit aware, sequential).
 * @param {object[]} sections - Array of section objects
 * @returns {Promise<string[]>} Array of prompts in same order
 */
export async function generateScenePromptBatch(sections) {
  const prompts = [];
  for (const section of sections) {
    prompts.push(await generateScenePrompt(section));
  }
  return prompts;
}

// ── Character Passport Generator ─────────────────────────────────────────────

const PASSPORT_SYSTEM = `You are a visual character designer for AI video generation.
Return ONLY valid JSON — no markdown, no explanation, no code fences.`;

const PASSPORT_TEMPLATE = ({ description, genre, mood }) =>
  `Character description: ${description}
Music genre and mood: ${genre || 'general'} — ${mood || 'neutral'}

Generate a Character Passport as JSON:
{
  "name": "character name",
  "appearance": "detailed physical description for image generation prompts",
  "style": "visual art style, lighting, color palette",
  "seed_policy": "recommended seed range for consistency e.g. 42-100",
  "prompt_anchors": ["anchor phrase 1", "anchor phrase 2", "anchor phrase 3"],
  "negative_prompts": ["what to avoid 1", "what to avoid 2"],
  "mood_variants": {
    "verse": "subtle appearance adjustment for verses",
    "chorus": "heightened visual energy for chorus",
    "bridge": "transformation or contrast for bridge"
  }
}`;

/**
 * Generate (or retrieve cached) Character Passport.
 * Caches by description key to avoid regenerating per scene.
 * @param {object} opts - { description, genre, mood }
 * @returns {Promise<object>} Character passport JSON
 */
export async function generateCharacterPassport({ description, genre, mood } = {}) {
  if (!description?.trim()) throw new Error('description is required');

  const cacheKey = `${description}|${genre}|${mood}`;
  if (passportCache.has(cacheKey)) {
    console.log('[NIM] passport cache hit:', cacheKey.slice(0, 40));
    return passportCache.get(cacheKey);
  }

  const text = await nim.chat(
    [
      { role: 'system', content: PASSPORT_SYSTEM },
      { role: 'user', content: PASSPORT_TEMPLATE({ description, genre, mood }) },
    ],
    { maxTokens: 800, temperature: 0.5 }
  );

  const passport = parseJSON(text, 'character passport');
  passportCache.set(cacheKey, passport);
  return passport;
}

/** Clear the passport cache (call between sessions) */
export function clearPassportCache() {
  passportCache.clear();
}

// ── NIM health check ─────────────────────────────────────────────────────────

export async function nimHealthCheck() {
  return nim.isHealthy();
}

export { nim };

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseJSON(text, label) {
  // Strip markdown code fences if model included them
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse ${label} JSON: ${err.message}\nRaw: ${cleaned.slice(0, 200)}`);
  }
}
