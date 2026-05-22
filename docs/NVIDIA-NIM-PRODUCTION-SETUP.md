# More-of-Less Studio — NVIDIA NIM Free Inference Production Setup

## Overview

This document describes the production-ready deployment of **More-of-Less Studio** using the **NVIDIA NIM free proxy** for LLM inference ($0 cost, 40 req/min limit).

### Two-Layer Architecture

- **LLM Layer** (prompts, scripts, character passports, lyrics analysis) → **FREE via NVIDIA NIM**
- **Video Rendering Layer** (LTX, ComfyUI, fal.ai) → Self-hosted or managed service

## Environment Setup

### 1. Development Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Add these lines to `.env`:

```bash
# FREE LLM INFERENCE
OPENAI_API_KEY=dummy
OPENAI_BASE_URL=http://31.220.58.212:8082
OPENAI_MODEL=moonshotai/kimi-k2-thinking
NIM_PROXY_HEALTH_CHECK_ENABLED=true

# VIDEO RENDERING (local or VPS)
COMFYUI_URL=http://localhost:8188
LTX_WORKER_URL=http://localhost:8101
```

### 2. Production Setup

Copy `.env.production.example` to your production environment:

```bash
# On your production server
export NODE_ENV=production
export OPENAI_API_KEY=dummy
export OPENAI_BASE_URL=http://31.220.58.212:8082
export OPENAI_MODEL=moonshotai/kimi-k2-thinking
export COMFYUI_URL=https://your-vps.com:8188
export LTX_WORKER_URL=https://your-vps.com:8101
```

## Health Check & Monitoring

### Check NVIDIA NIM Proxy Health

```bash
curl http://31.220.58.212:8082/health
```

Expected response:
```json
{
  "healthy": true,
  "status": 200,
  "url": "http://31.220.58.212:8082"
}
```

### API Health Endpoint

```bash
curl http://localhost:3000/api/health/nim
```

This endpoint checks:
- NVIDIA NIM proxy connectivity
- Response time
- Proxy availability

## API Endpoints

### 1. Character Passport Generation

**POST** `/api/ai/character-passport`

Request:
```json
{
  "description": "A ethereal woman with flowing silver hair, wearing a crystal dress",
  "musicMood": "dreamy pop"
}
```

Response:
```json
{
  "name": "Luminescence",
  "appearance": "detailed physical description...",
  "style": "ethereal, glowing, crystalline",
  "seed_policy": "seed 42-142",
  "prompt_anchors": ["ethereal", "glowing", "crystalline"],
  "negative_prompts": ["dark", "evil", "sinister"],
  "mood_variants": {
    "verse": "subdued, contemplative glow",
    "chorus": "bright, energetic luminescence",
    "bridge": "intense, chaotic light"
  }
}
```

### 2. Scene Prompt Generation

**POST** `/api/ai/scene-prompt`

Request:
```json
{
  "section": "verse",
  "startTime": 0,
  "endTime": 5,
  "lyrics": "She walks through the night, a light in the darkness",
  "bpm": 120,
  "mood": "dreamy",
  "energy": 5,
  "characterPassport": {
    "name": "Luminescence",
    "appearance": "ethereal woman with silver hair..."
  }
}
```

Response:
```json
{
  "prompt": "Wide establishing shot of an ethereal woman walking through a dark forest. Soft blue moonlight illuminates her crystalline dress. Camera slowly pans left following her movement. Particles of light swirl around her, creating a dreamy atmosphere...",
  "usage": {
    "prompt_tokens": 145,
    "completion_tokens": 287,
    "total_tokens": 432
  }
}
```

### 3. Lyrics Analysis

**POST** `/api/ai/lyrics-analysis`

Request:
```json
{
  "lyrics": "Verse 1 lyrics...\nChorus lyrics...",
  "musicInfo": {
    "genre": "pop",
    "bpm": 120,
    "duration": 240
  }
}
```

Response:
```json
{
  "analysis": {
    "overall_mood": "introspective and hopeful",
    "energy_level": 7,
    "visual_themes": ["transformation", "light", "growth"],
    "color_palette": ["gold", "blue", "white"],
    "sections": [
      {
        "type": "verse",
        "mood": "contemplative",
        "energy": 4,
        "imagery": "intimate, close-up shots"
      },
      {
        "type": "chorus",
        "mood": "empowering",
        "energy": 9,
        "imagery": "expansive, wide shots"
      }
    ]
  },
  "usage": {
    "prompt_tokens": 245,
    "completion_tokens": 412,
    "total_tokens": 657
  }
}
```

### 4. Music Video Script Generation

**POST** `/api/ai/music-video-script`

Request:
```json
{
  "lyrics": "Full song lyrics...",
  "characterPassport": { ... },
  "lyricsAnalysis": { ... },
  "duration": 240
}
```

Response:
```json
{
  "script": {
    "title": "Luminescence - Music Video",
    "shots": [
      {
        "shot_number": 1,
        "time_code": "0:00-0:05",
        "description": "Wide shot of night forest with character appearing from mist",
        "camera_movement": "dolly back",
        "lighting": "cool blue moonlight",
        "character_action": "emerges from darkness, looks up"
      },
      ...
    ]
  },
  "usage": {
    "prompt_tokens": 612,
    "completion_tokens": 1024,
    "total_tokens": 1636
  }
}
```

## Rate Limiting & Best Practices

### NVIDIA NIM Proxy Limits

- **40 requests/minute** (free tier)
- Can request increase at https://docs.nvidia.com/nim
- Shared free proxy — be respectful with batch requests

### Optimization Strategies

1. **Batch Operations**
   - Generate all scene prompts in sequence with 1.5s delay
   - Cache character passports (reuse across all scenes)
   - Reuse lyrics analysis across multiple calls

2. **Cost Estimation**
   - Typical 4-minute music video: 16-20 scene prompts
   - Average tokens per request: 400-800 tokens
   - **Total cost: $0** (free NVIDIA NIM tier)

3. **Production Best Practices**
   - Implement exponential backoff for rate limit errors
   - Cache generated passports and analyses
   - Monitor `/api/health/nim` regularly
   - Set up alerts for NIM proxy downtime
   - Implement request throttling in your frontend

## Client Integration

### Node.js / TypeScript

```javascript
import OpenAI from "openai";

const ai = new OpenAI({
  baseURL: "http://31.220.58.212:8082",
  apiKey: "dummy",
});

const result = await ai.chat.completions.create({
  model: "moonshotai/kimi-k2-thinking",
  messages: [
    {
      role: "user",
      content: "Generate a character passport for an ethereal woman...",
    },
  ],
  temperature: 0.7,
  max_tokens: 2048,
});

console.log(result.choices[0].message.content);
```

### Python

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://31.220.58.212:8082",
    api_key="dummy"
)

response = client.chat.completions.create(
    model="moonshotai/kimi-k2-thinking",
    messages=[{
        "role": "user",
        "content": "Generate a character passport..."
    }],
    temperature=0.7,
    max_tokens=2048
)

print(response.choices[0].message.content)
```

## Production Deployment Checklist

- [x] Environment variables configured (`.env.production`)
- [x] Health check endpoint deployed (`/api/health/nim`)
- [x] Rate limiting implemented in frontend/backend
- [x] Error handling for rate limit (429) responses
- [x] Caching layer for character passports
- [x] Monitoring alerts set up for NIM proxy
- [x] Request throttling/queuing implemented
- [x] Documentation for developers
- [x] Fallback behavior for proxy downtime
- [x] Video rendering pipeline configured (ComfyUI/LTX)

## Troubleshooting

### NIM Proxy Connection Issues

```bash
# Test connectivity
curl -v http://31.220.58.212:8082/health

# Check DNS resolution
nslookup 31.220.58.212
```

### Rate Limit Errors (429)

If you receive `429 Too Many Requests`:

1. Implement exponential backoff (2s, 4s, 8s, 16s)
2. Queue requests if necessary
3. Request rate limit increase from NVIDIA
4. Consider fallback to alternative LLM provider

### Character Passport JSON Parse Errors

- The NIM proxy sometimes returns unformatted JSON
- Use fallback templates if parsing fails
- Log raw content for debugging
- Consider enforcing stricter response format

## Security Notes

- `OPENAI_API_KEY=dummy` is intentionally set to "dummy" (no real credentials)
- Free NVIDIA NIM proxy is publicly available
- Do not commit real API keys to version control
- All data passed through the proxy is subject to NVIDIA's privacy policy

## Next Steps

1. **Video Rendering**: Set up ComfyUI or LTX worker on your VPS
2. **Frontend Integration**: Wire character passport API into studio UI
3. **Monitoring**: Set up dashboards for NIM proxy health & usage
4. **Scaling**: Plan migration path if rate limits become bottleneck

## References

- NVIDIA NIM Documentation: https://docs.nvidia.com/nim
- OpenAI Python SDK: https://github.com/openai/openai-python
- More-of-Less Studio: https://github.com/executiveusa/pauli-Open-Generative-AI
