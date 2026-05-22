# AI Inference Module

Free LLM inference layer for More-of-Less Studio using NVIDIA NIM proxy.

## Files

- **index.js** — Core OpenAI client initialization and health checks
- **generators.js** — High-level generation functions for content creation
- **README.md** — This file

## Environment Variables

```bash
OPENAI_API_KEY=dummy
OPENAI_BASE_URL=http://31.220.58.212:8082
OPENAI_MODEL=moonshotai/kimi-k2-thinking
```

## Usage

### Core Functions (index.js)

**getAIClient()** — Returns singleton OpenAI client
```javascript
const client = getAIClient();
```

**generateWithAI(messages, options)** — Low-level API call
```javascript
const result = await generateWithAI([
  { role: "user", content: "Your prompt here" }
], {
  temperature: 0.7,
  maxTokens: 2048
});
```

**healthCheck()** — Check NVIDIA NIM proxy status
```javascript
const status = await healthCheck();
// Returns: { healthy, status, url, error? }
```

### Generator Functions (generators.js)

**generateCharacterPassport(description, musicMood)**
```javascript
const passport = await generateCharacterPassport(
  "Ethereal woman with silver hair",
  "dreamy pop"
);
// Returns: { success, data: {...}, usage, error? }
```

**generateScenePrompt(...)**
```javascript
const scene = await generateScenePrompt(
  "verse",  // section
  0,        // startTime
  5,        // endTime
  "lyrics", // lyrics
  120,      // bpm
  "dreamy", // mood
  5,        // energy (1-10)
  passport  // characterPassport
);
// Returns: { success, prompt, usage, error? }
```

**generateLyricsAnalysis(lyrics, musicInfo)**
```javascript
const analysis = await generateLyricsAnalysis(
  "Song lyrics...",
  { genre: "pop", bpm: 120, duration: 240 }
);
// Returns: { success, analysis: {...}, usage, error? }
```

**generateMusicVideoScript(lyrics, characterPassport, lyricsAnalysis, duration)**
```javascript
const script = await generateMusicVideoScript(
  "Full lyrics...",
  passport,
  analysis,
  240  // duration in seconds
);
// Returns: { success, script: {...}, usage, error? }
```

## Error Handling

All generator functions return:
```typescript
{
  success: boolean,
  data?: any,           // Parsed JSON result
  prompt?: string,      // Raw generated text
  analysis?: any,       // Structured data
  usage?: {
    prompt_tokens: number,
    completion_tokens: number,
    total_tokens: number
  },
  error?: string,       // Error message if failed
  rawContent?: string   // Raw response (if parsing failed)
}
```

## Rate Limiting

NVIDIA NIM free tier: **40 requests/minute**

Implement client-side throttling:
```javascript
import AIClient from "@/lib/ai-client";

const aiClient = new AIClient();

// Client SDK handles basic rate limiting
const passport = await aiClient.generateCharacterPassport(
  "description",
  "mood"
);
```

## Caching

Results should be cached to avoid regeneration:
```javascript
const cache = new Map();

async function cachedPassport(desc, mood) {
  const key = `${desc}:${mood}`;
  if (cache.has(key)) return cache.get(key);

  const result = await generateCharacterPassport(desc, mood);
  cache.set(key, result);
  setTimeout(() => cache.delete(key), 3600000); // 1 hour TTL

  return result;
}
```

## Monitoring

Check proxy health regularly:
```javascript
import { healthCheck } from "@/lib/ai-inference";

setInterval(async () => {
  const health = await healthCheck();
  if (!health.healthy) {
    console.error("NIM proxy is down!");
    // Disable AI features or show fallback UI
  }
}, 300000); // 5 minutes
```

## Production Deployment

1. Ensure environment variables are set
2. Implement request queuing for rate limit handling
3. Cache character passports and analyses
4. Set up monitoring for proxy health
5. Implement fallback UI for when NIM proxy is unavailable

## Troubleshooting

**JSON Parse Errors**
- Some responses may have formatting issues
- Implement retry logic
- Use fallback templates if parsing fails

**Timeout Errors**
- Increase timeout if needed
- Check network connectivity to NIM proxy
- Implement request cancellation

**Rate Limit (429)**
- Implement exponential backoff
- Queue requests
- Cache aggressively
- Request rate limit increase from NVIDIA

## API Endpoints

These generators are exposed via Next.js API routes:
- `POST /api/ai/character-passport`
- `POST /api/ai/scene-prompt`
- `POST /api/ai/lyrics-analysis`
- `POST /api/ai/music-video-script`
- `GET /api/health/nim`

See `/docs/NVIDIA-NIM-PRODUCTION-SETUP.md` for detailed API documentation.
