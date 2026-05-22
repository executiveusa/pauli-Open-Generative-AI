# Quick Start: AI Integration with More-of-Less Studio

## Setup (2 minutes)

1. **Environment**
   ```bash
   # Add to .env
   OPENAI_API_KEY=dummy
   OPENAI_BASE_URL=http://31.220.58.212:8082
   OPENAI_MODEL=moonshotai/kimi-k2-thinking
   ```

2. **Test Health Check**
   ```bash
   curl http://localhost:3000/api/health/nim
   ```

## Usage

### React Component Example

```javascript
import AIClient from "@/lib/ai-client";
import { useState } from "react";

export default function CharacterBuilder() {
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(false);

  const aiClient = new AIClient();

  async function handleCreateCharacter(description, mood) {
    setLoading(true);
    try {
      const result = await aiClient.generateCharacterPassport(
        description,
        mood
      );
      setPassport(result);
    } catch (error) {
      console.error("Failed to generate passport:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={() =>
          handleCreateCharacter(
            "Ethereal woman with silver hair",
            "dreamy pop"
          )
        }
        disabled={loading}
      >
        {loading ? "Generating..." : "Create Character"}
      </button>

      {passport && (
        <div>
          <h3>{passport.name}</h3>
          <p>{passport.appearance}</p>
          <p>Style: {passport.style}</p>
        </div>
      )}
    </div>
  );
}
```

### Server-Side Generation

```javascript
// In your Next.js API route
import { generateCharacterPassport } from "@/lib/ai-inference/generators";

export async function POST(request) {
  const { description, musicMood } = await request.json();

  const result = await generateCharacterPassport(
    description,
    musicMood
  );

  if (!result.success) {
    return Response.json({ error: result.error }, { status: 500 });
  }

  return Response.json(result.data);
}
```

### Music Video Script Workflow

```javascript
import AIClient from "@/lib/ai-client";

const aiClient = new AIClient();

// 1. Analyze lyrics
const analysis = await aiClient.analyzeLyrics(songLyrics, {
  genre: "pop",
  bpm: 120,
  duration: 240,
});

// 2. Create character
const character = await aiClient.generateCharacterPassport(
  "A mysterious figure in a city at night",
  analysis.analysis.overall_mood
);

// 3. Generate scenes
const scenes = [];
for (const section of analysis.analysis.sections) {
  const prompt = await aiClient.generateScenePrompt(
    section.type,
    section.start_time,
    section.end_time,
    section.lyrics,
    120,
    section.mood,
    section.energy,
    character
  );
  scenes.push(prompt);
}

// 4. Create full script
const script = await aiClient.generateMusicVideoScript(
  songLyrics,
  character,
  analysis.analysis,
  240
);

console.log("Ready for video rendering!", {
  character,
  scenes,
  script: script.script,
});
```

## Streaming Responses (Optional)

For long-running generations, implement Server-Sent Events:

```javascript
export async function POST(request) {
  const { lyrics } = await request.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await generateMusicVideoScript(lyrics);

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(result)}\n\n`)
        );
        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

## Error Handling

```javascript
async function safeGenerate(fn, fallback = null) {
  try {
    return await fn();
  } catch (error) {
    console.error("AI generation failed:", error.message);

    // Return fallback for production
    if (process.env.NODE_ENV === "production") {
      return fallback || { error: "Generation unavailable" };
    }

    throw error;
  }
}

// Usage
const passport = await safeGenerate(
  () =>
    aiClient.generateCharacterPassport(
      "A mysterious figure",
      "ethereal"
    ),
  {
    name: "Default Character",
    appearance: "A figure in shadow",
    style: "cinematic",
  }
);
```

## Rate Limiting

Implement client-side throttling:

```javascript
class ThrottledAIClient {
  constructor(requestsPerMinute = 30) {
    this.queue = [];
    this.inProgress = 0;
    this.limit = requestsPerMinute;
    this.resetTime = Date.now() + 60000;
  }

  async request(fn) {
    // Wait if at limit
    while (this.inProgress >= this.limit) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Reset counter every minute
    if (Date.now() > this.resetTime) {
      this.inProgress = 0;
      this.resetTime = Date.now() + 60000;
    }

    this.inProgress++;
    try {
      return await fn();
    } finally {
      this.inProgress--;
    }
  }
}
```

## Caching

Cache expensive generations:

```javascript
const cache = new Map();

async function cachedCharacterPassport(
  description,
  mood
) {
  const key = `char:${description}:${mood}`;

  if (cache.has(key)) {
    return cache.get(key);
  }

  const result = await aiClient.generateCharacterPassport(
    description,
    mood
  );

  cache.set(key, result);

  // Expire after 1 hour
  setTimeout(() => cache.delete(key), 3600000);

  return result;
}
```

## Monitoring

```javascript
async function monitorAIHealth() {
  setInterval(async () => {
    const health = await aiClient.checkHealth();

    if (!health.healthy) {
      console.error("NIM Proxy is down!");
      // Alert user or disable AI features
    }
  }, 300000); // Check every 5 minutes
}
```

## Common Issues

### "Failed to parse JSON"
- Ensure character descriptions are specific
- Check for special characters in lyrics
- Implement retry logic

### Rate Limit (429)
- Implement exponential backoff
- Queue requests
- Cache results aggressively

### Timeout
- Increase timeout if using slow network
- Implement request cancellation
- Use streaming for long responses

## Next Steps

1. Wire character passport into your studio UI
2. Implement scene prompt generation for video preview
3. Add music video script generation to your workflow
4. Set up monitoring dashboard for AI usage
