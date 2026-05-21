# Cynthia Gateway API Contract

**Version:** 1.0.0  
**Last Updated:** 2026-05-18  
**Base URL:** `https://gateway.cynthia.studio/api/v1`

## Overview

Cynthia Gateway is a multi-provider AI gateway that orchestrates requests across multiple AI providers (OpenAI, Google Vertex AI, Runway, Kling, etc.) with intelligent routing, fallback logic, and unified response formatting.

This document specifies the complete API contract for integrating with Cynthia Gateway.

## Authentication

All requests require a bearer token in the `Authorization` header:

```http
Authorization: Bearer <CYNTHIA_GATEWAY_API_KEY>
```

API keys are obtained from the Cynthia Dashboard and should be treated as secrets. Never expose them in client-side code.

## Rate Limiting

- **Standard Tier:** 100 requests/minute per API key
- **Professional Tier:** 1000 requests/minute per API key
- **Enterprise Tier:** Custom limits

Rate limit headers are returned with all responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1684495200
```

## Error Codes

All errors follow RFC 7807 Problem Details format:

### 400 Bad Request
```json
{
  "type": "bad_request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid parameter: prompt is required",
  "instance": "/generate"
}
```

### 401 Unauthorized
```json
{
  "type": "unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid or missing API key"
}
```

### 402 Payment Required
```json
{
  "type": "payment_required",
  "title": "Payment Required",
  "status": 402,
  "detail": "Account credits exhausted. Please add payment method."
}
```

### 429 Too Many Requests
```json
{
  "type": "rate_limit_exceeded",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "Rate limit exceeded. Reset at 2026-05-18T15:30:00Z",
  "retry-after": 60
}
```

### 500 Internal Server Error
```json
{
  "type": "internal_error",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "An unexpected error occurred"
}
```

### 503 Service Unavailable
```json
{
  "type": "service_unavailable",
  "title": "Service Unavailable",
  "status": 503,
  "detail": "All providers are currently unavailable. Please try again later."
}
```

## Endpoints

### POST /generate

Generate content through the gateway with intelligent provider routing.

#### Request

```http
POST /api/v1/generate
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "type": "image",
  "model": "auto",
  "prompt": "A vibrant street scene in Mexico City with colorful buildings",
  "negative_prompt": "blurry, low quality, distorted",
  "size": "1024x1024",
  "provider": "auto",
  "routing_strategy": "best_quality",
  "language": "es",
  "region": "es-MX",
  "character_id": "char_123",
  "job_id": "job_456",
  "webhook_url": "https://myapp.com/webhooks/generation_complete",
  "metadata": {
    "campaign_id": "campaign_789",
    "user_context": "bilingual_content"
  }
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | Content type: `image`, `video`, `text`, or `lipsync` |
| `model` | string | No | Model identifier or `auto` for automatic selection (default: `auto`) |
| `prompt` | string | Yes | Text prompt in English or Spanish |
| `negative_prompt` | string | No | Negative guidance for generation |
| `size` | string | No | Output size: `512x512`, `1024x1024`, `1920x1080`, etc. (default: `1024x1024`) |
| `provider` | string | No | Specific provider or `auto` for automatic (default: `auto`) |
| `routing_strategy` | string | No | One of: `auto`, `best_quality`, `cheapest`, `fastest`, `best_latam`, `consistency` (default: `auto`) |
| `language` | string | No | Content language: `en` or `es` (default: `en`) |
| `region` | string | No | Target region: `es-MX`, `es-CO`, `es-AR`, `es-CL`, `es-PE`, `es-US`, etc. |
| `character_id` | string | No | Reference character for consistency checks |
| `job_id` | string | No | Unique job identifier for tracking |
| `webhook_url` | string | No | Callback URL for async completion |
| `metadata` | object | No | Custom metadata for tracking |

#### Response

```json
{
  "job_id": "gen_1684495156234",
  "status": "queued",
  "provider": "openai",
  "model": "dall-e-3",
  "type": "image",
  "artifact": {
    "id": "art_789",
    "type": "image",
    "url": "https://gateway.cynthia.studio/artifacts/art_789",
    "format": "url",
    "size": {
      "width": 1024,
      "height": 1024
    },
    "created_at": "2026-05-18T14:25:56Z"
  },
  "metadata": {
    "provider": "openai",
    "model": "dall-e-3",
    "cost": {
      "usd": 0.06,
      "credits": 6
    },
    "quality_score": 0.92,
    "processing_time_ms": 2345,
    "region": "es-MX",
    "language": "es"
  },
  "links": {
    "self": "/job/gen_1684495156234",
    "job_status": "/job/gen_1684495156234/status",
    "cancel": "/job/gen_1684495156234/cancel"
  }
}
```

### GET /job/{jobId}

Get the status and details of a generation job.

#### Request

```http
GET /api/v1/job/gen_1684495156234
Authorization: Bearer <API_KEY>
```

#### Response

```json
{
  "job_id": "gen_1684495156234",
  "status": "succeeded",
  "provider": "openai",
  "model": "dall-e-3",
  "type": "image",
  "artifact": {
    "id": "art_789",
    "type": "image",
    "url": "https://gateway.cynthia.studio/artifacts/art_789",
    "format": "url",
    "size": {
      "width": 1024,
      "height": 1024
    },
    "created_at": "2026-05-18T14:25:56Z"
  },
  "metadata": {
    "provider": "openai",
    "model": "dall-e-3",
    "cost": {
      "usd": 0.06,
      "credits": 6
    },
    "quality_score": 0.92,
    "processing_time_ms": 2345,
    "completed_at": "2026-05-18T14:28:41Z"
  },
  "links": {
    "self": "/job/gen_1684495156234",
    "artifact": "https://gateway.cynthia.studio/artifacts/art_789"
  }
}
```

### POST /lipsync

Generate lip-synced video from audio and character reference.

#### Request

```http
POST /api/v1/lipsync
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "character_id": "char_123",
  "audio_url": "https://assets.cynthia.studio/audio/dialogue_123.mp3",
  "audio_base64": "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//NJZAAAAADwAAAA...",
  "video_url": "https://assets.cynthia.studio/video/hero_frame_123.mp4",
  "provider": "runway",
  "model": "gen-2",
  "region": "es-MX",
  "metadata": {
    "dialogue_language": "es",
    "character_voice_id": "voice_456"
  }
}
```

#### Response

```json
{
  "job_id": "lips_1684495156234",
  "status": "queued",
  "provider": "runway",
  "type": "video",
  "artifact": {
    "id": "art_790",
    "type": "video",
    "url": "https://gateway.cynthia.studio/artifacts/art_790",
    "format": "url",
    "duration_seconds": 12.5
  },
  "metadata": {
    "provider": "runway",
    "model": "gen-2",
    "cost": {
      "usd": 0.15,
      "credits": 15
    },
    "processing_time_ms": 5000
  },
  "links": {
    "self": "/job/lips_1684495156234",
    "job_status": "/job/lips_1684495156234/status"
  }
}
```

### POST /evaluate

Evaluate generated artifacts for quality metrics.

#### Request

```http
POST /api/v1/evaluate
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "job_id": "gen_1684495156234",
  "artifact_id": "art_789",
  "artifact_type": "image",
  "character_id": "char_123",
  "evaluation_type": "rule_based",
  "dimensions": [
    "identity_consistency",
    "wardrobe_consistency",
    "location_consistency",
    "lighting_coherence",
    "camera_adherence",
    "motion_quality",
    "lip_sync_quality",
    "spanish_localization",
    "latam_cultural_fit",
    "rights_compliance"
  ]
}
```

#### Response

```json
{
  "job_id": "gen_1684495156234",
  "evaluation_id": "eval_987",
  "status": "completed",
  "evaluation_type": "rule_based",
  "timestamp": "2026-05-18T14:30:00Z",
  "scores": {
    "identity_consistency": 0.92,
    "wardrobe_consistency": 0.88,
    "location_consistency": 0.85,
    "lighting_coherence": 0.90,
    "camera_adherence": 0.87,
    "motion_quality": 0.84,
    "lip_sync_quality": 0.89,
    "spanish_localization": 0.92,
    "latam_cultural_fit": 0.88,
    "rights_compliance": 0.95
  },
  "overall_score": 0.89,
  "passed": true,
  "recommendations": [
    "Strong consistency across all dimensions",
    "LatAm cultural fit is excellent"
  ],
  "metadata": {
    "evaluation_model": "rule_based_v1",
    "processing_time_ms": 234
  }
}
```

### POST /route

Route requests intelligently to the best provider based on criteria.

#### Request

```http
POST /api/v1/route
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "type": "image",
  "prompt": "A woman in traditional Mexican dress",
  "strategy": "best_latam",
  "constraints": {
    "max_cost_usd": 0.10,
    "max_processing_time_ms": 5000,
    "required_capabilities": ["bilingual", "cultural_awareness"],
    "region": "es-MX"
  }
}
```

#### Response

```json
{
  "routing_decision": {
    "primary_provider": "openai",
    "primary_model": "dall-e-3",
    "fallback_providers": [
      {
        "provider": "runway",
        "model": "stable-diffusion-3"
      },
      {
        "provider": "kling",
        "model": "kling-v1"
      }
    ],
    "reasoning": "Best quality for LatAm-optimized image generation within budget",
    "estimated_cost_usd": 0.06,
    "estimated_processing_time_ms": 2500
  },
  "metadata": {
    "routing_version": "v2.1",
    "timestamp": "2026-05-18T14:25:56Z"
  }
}
```

### GET /models

List available models and their capabilities.

#### Request

```http
GET /api/v1/models?provider=auto&type=image&region=es-MX
Authorization: Bearer <API_KEY>
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `provider` | string | Filter by provider: `openai`, `google`, `runway`, etc. or `auto` for all |
| `type` | string | Filter by type: `image`, `video`, `text`, `lipsync` |
| `region` | string | Target region for optimization |
| `sort` | string | Sort by: `quality`, `cost`, `speed`, `latam_fit` |

#### Response

```json
{
  "models": [
    {
      "id": "dall-e-3",
      "provider": "openai",
      "name": "DALL-E 3",
      "type": "image",
      "description": "State-of-the-art image generation with exceptional quality",
      "capabilities": [
        "image-generation",
        "image-editing",
        "inpainting"
      ],
      "cost": {
        "per_request_usd": 0.06,
        "per_1k_tokens": 0.002
      },
      "latency": {
        "p50_ms": 2000,
        "p95_ms": 3500
      },
      "quality_score": 0.95,
      "latam_fit_score": 0.92,
      "supported_regions": [
        "es-MX",
        "es-CO",
        "es-AR",
        "es-CL",
        "es-PE",
        "es-US"
      ]
    },
    {
      "id": "gen-2",
      "provider": "runway",
      "name": "Runway Gen-2",
      "type": "video",
      "description": "High-quality video generation with consistency",
      "capabilities": [
        "video-generation",
        "video-editing",
        "lip-sync"
      ],
      "cost": {
        "per_request_usd": 0.15,
        "per_second_video": 0.01
      },
      "latency": {
        "p50_ms": 5000,
        "p95_ms": 8000
      },
      "quality_score": 0.89,
      "latam_fit_score": 0.85
    }
  ],
  "metadata": {
    "total_models": 45,
    "filtered_count": 8,
    "timestamp": "2026-05-18T14:25:56Z"
  }
}
```

## Webhooks

When providing a `webhook_url` in generation requests, Cynthia Gateway will POST to your endpoint when the job completes:

### Webhook Payload

```json
{
  "event": "generation.completed",
  "job_id": "gen_1684495156234",
  "status": "succeeded",
  "artifact": {
    "id": "art_789",
    "type": "image",
    "url": "https://gateway.cynthia.studio/artifacts/art_789"
  },
  "metadata": {
    "processing_time_ms": 2345,
    "cost": {
      "usd": 0.06,
      "credits": 6
    }
  },
  "timestamp": "2026-05-18T14:28:41Z"
}
```

Webhooks are retried with exponential backoff for up to 24 hours if your endpoint returns a non-2xx status.

## Artifact Management

Artifacts are stored securely and are accessible for 30 days. After 30 days, artifacts are automatically deleted.

You can retrieve artifacts via:

```http
GET /api/v1/artifacts/art_789
Authorization: Bearer <API_KEY>
```

Or access them directly via the provided URL (requires authentication in header).

## LatAm Features

### Spanish-First Support

- Native Spanish prompts with cultural understanding
- Bilingual output support
- Regional dialect options: Mexican, Colombian, Argentine, Chilean, Peruvian, US Hispanic

### LatAm Optimization

When `region` is set to an `es-*` code, the gateway:

1. Routes to models with strong Spanish language support
2. Applies cultural context filters
3. Prioritizes providers with LatAm-optimized training
4. Applies regional accent and dialect preferences
5. Returns bilingual metadata and cultural fit scores

### Character Consistency

For character-based generation, provide `character_id` and the gateway will:

1. Apply character-specific styling rules
2. Enforce wardrobe and appearance consistency
3. Validate against rights and consent requirements
4. Return consistency scores in evaluation

## Rate Limit Strategies

If rate-limited:

1. **Backoff:** Exponential backoff starting at 1 second
2. **Retry-After:** Respect the `Retry-After` header
3. **Queue:** Consider using the webhook approach for batch operations

Example backoff: 1s → 2s → 4s → 8s → 16s → 32s → 60s (capped)

## Best Practices

1. **Use Webhooks:** For production workloads, use webhooks instead of polling
2. **Batch Operations:** Group similar requests together
3. **Error Handling:** Implement proper error handling with fallback providers
4. **Caching:** Cache model lists and availability status locally
5. **Monitoring:** Monitor cost and latency metrics
6. **Timeout:** Set a reasonable timeout (30 seconds) for API calls
7. **Versioning:** Pin specific model versions in production

## Changelog

### 1.0.0 (2026-05-18)
- Initial release with support for image, video, and text generation
- LatAm-first features and regional optimization
- Complete provider routing and fallback logic
- Webhook support for async operations
- Evaluation metrics across 10 dimensions
