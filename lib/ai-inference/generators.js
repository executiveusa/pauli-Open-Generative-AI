import { generateWithAI } from "./index.js";

const CHARACTER_PASSPORT_TEMPLATE = `You are a visual character designer for AI video generation.

Given this character description: {description}
And this music mood/genre: {musicMood}

Generate a Character Passport JSON with strict structure:
{
  "name": "character name from description or invented",
  "appearance": "detailed physical description suitable for image generation (100-150 words)",
  "style": "visual art style, lighting, color palette, material textures",
  "seed_policy": "stable seed range like 'seed 42-142' for consistency",
  "prompt_anchors": ["anchor1", "anchor2", "anchor3"],
  "negative_prompts": ["avoid1", "avoid2"],
  "mood_variants": {
    "verse": "how character appears in verses",
    "chorus": "how character appears in chorus",
    "bridge": "how character appears in bridge"
  }
}

Output ONLY valid JSON, no markdown code blocks.`;

const SCENE_PROMPT_TEMPLATE = `You are a cinematographer generating video prompts for AI video generation.

Song section: {section}
Time: {startTime}s - {endTime}s
Lyrics: {lyrics}
BPM: {bpm}
Mood: {mood}
Energy: {energy}
Character: {character}

Generate a cinematic video prompt (max 200 words) for this section.
Include: camera angle, movement, lighting, environment, character action.
Make it beat-synchronized and emotionally matching the music.
Output only the prompt, no explanation.`;

export async function generateCharacterPassport(description, musicMood) {
  if (!description) {
    return {
      success: false,
      error: "Character description is required",
    };
  }

  const prompt = CHARACTER_PASSPORT_TEMPLATE.replace("{description}", description)
    .replace("{musicMood}", musicMood || "upbeat pop");

  const result = await generateWithAI([
    {
      role: "user",
      content: prompt,
    },
  ]);

  if (!result.success) {
    return result;
  }

  try {
    const jsonStr = result.content.trim();
    const parsed = JSON.parse(jsonStr);

    return {
      success: true,
      data: parsed,
      usage: result.usage,
    };
  } catch (parseError) {
    return {
      success: false,
      error: `Failed to parse passport JSON: ${parseError.message}`,
      rawContent: result.content,
    };
  }
}

export async function generateScenePrompt(
  section,
  startTime,
  endTime,
  lyrics,
  bpm,
  mood,
  energy,
  characterPassport
) {
  const characterDescription =
    characterPassport?.appearance || "a figure in ethereal light";

  const prompt = SCENE_PROMPT_TEMPLATE.replace("{section}", section)
    .replace("{startTime}", String(startTime))
    .replace("{endTime}", String(endTime))
    .replace("{lyrics}", lyrics || "")
    .replace("{bpm}", String(bpm || 120))
    .replace("{mood}", mood || "neutral")
    .replace("{energy}", energy || "medium")
    .replace("{character}", characterDescription);

  const result = await generateWithAI(
    [
      {
        role: "user",
        content: prompt,
      },
    ],
    {
      temperature: 0.8,
      maxTokens: 1000,
    }
  );

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    prompt: result.content.trim(),
    usage: result.usage,
  };
}

export async function generateLyricsAnalysis(lyrics, musicInfo = {}) {
  const prompt = `Analyze these song lyrics and provide structured mood/energy/scene breakdown:

Lyrics:
${lyrics}

${
  musicInfo.genre
    ? `Genre: ${musicInfo.genre}`
    : ""
}
${musicInfo.bpm ? `BPM: ${musicInfo.bpm}` : ""}
${
  musicInfo.duration
    ? `Duration: ${musicInfo.duration}s`
    : ""
}

Return a JSON object with:
{
  "overall_mood": "descriptive mood",
  "energy_level": "1-10",
  "visual_themes": ["theme1", "theme2"],
  "color_palette": ["color1", "color2"],
  "sections": [
    {
      "type": "verse|chorus|bridge|outro",
      "mood": "mood for this section",
      "energy": "1-10",
      "imagery": "visual suggestions"
    }
  ]
}

Output ONLY valid JSON.`;

  const result = await generateWithAI([
    {
      role: "user",
      content: prompt,
    },
  ]);

  if (!result.success) {
    return result;
  }

  try {
    const jsonStr = result.content.trim();
    const parsed = JSON.parse(jsonStr);

    return {
      success: true,
      analysis: parsed,
      usage: result.usage,
    };
  } catch (parseError) {
    return {
      success: false,
      error: `Failed to parse analysis: ${parseError.message}`,
      rawContent: result.content,
    };
  }
}

export async function generateMusicVideoScript(
  lyrics,
  characterPassport,
  lyricsAnalysis,
  duration
) {
  const prompt = `You are a music video director. Create a detailed shot-by-shot script.

Song Duration: ${duration}s
Character: ${characterPassport?.name || "unnamed"}
Character Description: ${characterPassport?.appearance || "ethereal figure"}

Lyrics:
${lyrics}

Visual Mood Analysis:
${JSON.stringify(lyricsAnalysis, null, 2)}

Generate a music video script with sections:
{
  "title": "video title",
  "shots": [
    {
      "shot_number": 1,
      "time_code": "0:00-0:05",
      "description": "shot description",
      "camera_movement": "static|pan|zoom|dolly",
      "lighting": "lighting description",
      "character_action": "what character does"
    }
  ]
}

Output ONLY valid JSON.`;

  const result = await generateWithAI([
    {
      role: "user",
      content: prompt,
    },
  ]);

  if (!result.success) {
    return result;
  }

  try {
    const jsonStr = result.content.trim();
    const parsed = JSON.parse(jsonStr);

    return {
      success: true,
      script: parsed,
      usage: result.usage,
    };
  } catch (parseError) {
    return {
      success: false,
      error: `Failed to parse script: ${parseError.message}`,
      rawContent: result.content,
    };
  }
}
