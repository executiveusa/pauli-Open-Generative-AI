// AI Client SDK for More-of-Less Studio
// Simple HTTP client wrapper for AI generation endpoints

const API_BASE = typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL
  ? process.env.NEXT_PUBLIC_API_BASE_URL
  : "";

class AIClient {
  constructor(baseURL = API_BASE) {
    this.baseURL = baseURL || "";
  }

  async request(endpoint, payload) {
    const url = this.baseURL ? `${this.baseURL}${endpoint}` : endpoint;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `API error: ${response.status}`);
    }

    return response.json();
  }

  async generateCharacterPassport(description, musicMood = "upbeat pop") {
    return this.request("/api/ai/character-passport", {
      description,
      musicMood,
    });
  }

  async generateScenePrompt(
    section,
    startTime,
    endTime,
    lyrics = "",
    bpm = 120,
    mood = "neutral",
    energy = 5,
    characterPassport = null
  ) {
    return this.request("/api/ai/scene-prompt", {
      section,
      startTime,
      endTime,
      lyrics,
      bpm,
      mood,
      energy,
      characterPassport,
    });
  }

  async analyzeLyrics(lyrics, musicInfo = {}) {
    return this.request("/api/ai/lyrics-analysis", {
      lyrics,
      musicInfo,
    });
  }

  async generateMusicVideoScript(
    lyrics,
    characterPassport = null,
    lyricsAnalysis = null,
    duration = 240
  ) {
    return this.request("/api/ai/music-video-script", {
      lyrics,
      characterPassport,
      lyricsAnalysis,
      duration,
    });
  }

  async checkHealth() {
    const url = this.baseURL
      ? `${this.baseURL}/api/health/nim`
      : "/api/health/nim";
    const response = await fetch(url);
    return response.json();
  }
}

export default AIClient;
