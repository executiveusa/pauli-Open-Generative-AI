# Music Studio API Reference

## Overview

The Music Studio provides comprehensive APIs for AI-powered music generation with multi-locale support, rights validation, and artifact management.

## Base URL

```
/api/v1/music
```

## Authentication

All endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

## Endpoints

### Music Generation

#### POST `/generate`

Generate music based on request parameters.

**Request:**
```json
{
  "prompt": "upbeat electronic dance track",
  "locale": "es-MX",
  "bpm": 120,
  "durationSeconds": 60,
  "mode": "simple",
  "genre": "electronic",
  "mood": "energetic"
}
```

**Response:**
```json
{
  "id": "artifact_xyz123",
  "status": "completed",
  "audioUrl": "https://storage.example.com/music/artifact_xyz123.mp3",
  "durationSeconds": 60,
  "bpm": 120,
  "createdAt": "2026-05-31T10:00:00Z"
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid parameters (validation error)
- `402`: Quota exceeded
- `500`: Server error

### Locale Configuration

#### GET `/locales`

Get available locales and their configurations.

**Response:**
```json
{
  "locales": [
    {
      "code": "en-US",
      "language": "en",
      "defaultBpm": 120,
      "bpmRange": [60, 180],
      "genres": ["pop", "rock", "electronic"],
      "supportedModes": ["simple", "instrumental"],
      "providers": ["ace-step", "open-music"]
    }
  ]
}
```

#### GET `/locales/:locale/config`

Get configuration for a specific locale.

**Response:**
```json
{
  "locale": "es-MX",
  "language": "es",
  "defaultBpm": 100,
  "bpmRange": [90, 160],
  "genres": ["cumbia", "norteño", "regional"],
  "culturalInstruments": ["accordión", "vihuela", "guitarrón"],
  "providerChain": ["ace-step", "open-music"],
  "supportedModes": ["simple", "instrumental"]
}
```

### Rights Validation

#### POST `/rights/validate`

Validate music generation request against rights constraints.

**Request:**
```json
{
  "mode": "cover",
  "rightsIntent": "cover",
  "sourceAudioAssetId": "asset_123",
  "vocalStyle": "original"
}
```

**Response:**
```json
{
  "valid": true,
  "violations": [],
  "warnings": [],
  "requiresConsent": false
}
```

#### GET `/rights/consents/:mode`

Get required consents for a generation mode.

**Response:**
```json
{
  "consents": [
    {
      "type": "commercial_consent",
      "label": "Commercial Use Rights",
      "description": "I have rights to use this audio commercially",
      "required": true
    },
    {
      "type": "artist_credit",
      "label": "Artist Attribution",
      "description": "I will properly credit the original artist",
      "required": true
    }
  ]
}
```

### Usage & Quotas

#### GET `/quotas/remaining`

Get remaining quota for current user.

**Response:**
```json
{
  "tier": "free",
  "generationsRemaining": 5,
  "generationsLimit": 10,
  "minutesRemaining": 15.5,
  "minutesLimit": 30,
  "percentUsed": 50,
  "billingMonth": "2026-05",
  "resetsAt": "2026-06-01T00:00:00Z"
}
```

#### POST `/quotas/check`

Check if a generation is allowed under current quota.

**Request:**
```json
{
  "mode": "simple",
  "durationSeconds": 60,
  "language": "en"
}
```

**Response:**
```json
{
  "allowed": true,
  "reason": "ok",
  "quotaAfter": {
    "generationsRemaining": 4,
    "minutesRemaining": 14.5
  }
}
```

### Artifact Library

#### GET `/library/shared`

Get featured and trending artifacts.

**Query Parameters:**
- `limit`: (optional) Number of results per category (default: 10)
- `offset`: (optional) Pagination offset (default: 0)

**Response:**
```json
{
  "featured": [
    {
      "id": "artifact_featured_1",
      "title": "Sunset Ambient",
      "category": "ambient",
      "bpm": 60,
      "viewCount": 250,
      "remixCount": 5
    }
  ],
  "trending": [
    {
      "id": "artifact_trending_1",
      "title": "Urban Beat",
      "category": "hip-hop",
      "bpm": 90,
      "viewCount": 500,
      "remixCount": 20,
      "favoriteCount": 50
    }
  ]
}
```

#### GET `/library/:artifactId`

Get details of a specific artifact.

**Response:**
```json
{
  "id": "artifact_xyz123",
  "title": "Epic Track",
  "description": "A powerful electronic track",
  "category": "electronic",
  "bpm": 130,
  "durationSeconds": 120,
  "audioUrl": "https://storage.example.com/music/artifact_xyz123.mp3",
  "visibility": "public",
  "viewCount": 100,
  "remixCount": 5,
  "favoriteCount": 10,
  "createdAt": "2026-05-30T15:00:00Z"
}
```

#### POST `/library/:artifactId/remix`

Create a remix of an existing artifact.

**Request:**
```json
{
  "title": "My Remix",
  "mode": "remix",
  "prompt": "add more bass and drums"
}
```

**Response:**
```json
{
  "id": "artifact_remix_123",
  "baseArtifactId": "artifact_xyz123",
  "title": "My Remix",
  "audioUrl": "https://storage.example.com/music/artifact_remix_123.mp3",
  "createdAt": "2026-05-31T10:30:00Z"
}
```

### Music-to-Video

#### POST `/music-video/sessions`

Create a music-to-video session.

**Request:**
```json
{
  "musicArtifactId": "artifact_xyz123",
  "title": "Music Video",
  "concept": "upbeat modern video",
  "visualStyle": "cinematic",
  "colorPalette": "vibrant",
  "cameraMovement": "dynamic",
  "beatSyncIntensity": 75
}
```

**Response:**
```json
{
  "sessionId": "session_video_123",
  "musicArtifactId": "artifact_xyz123",
  "videoPrompt": "upbeat electronic music video with cinematic visuals and dynamic camera work",
  "status": "created",
  "createdAt": "2026-05-31T10:45:00Z"
}
```

#### GET `/music-video/sessions/:sessionId`

Get music-to-video session details.

**Response:**
```json
{
  "sessionId": "session_video_123",
  "musicArtifactId": "artifact_xyz123",
  "videoUrl": "https://storage.example.com/videos/session_video_123.mp4",
  "status": "completed",
  "visualStyle": "cinematic",
  "createdAt": "2026-05-31T10:45:00Z"
}
```

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid BPM range for locale",
    "details": {
      "field": "bpm",
      "value": 300,
      "constraint": "pt-BR max is 170"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `QUOTA_EXCEEDED` | 402 | User has exceeded their quota |
| `INVALID_LOCALE` | 400 | Unsupported locale specified |
| `RIGHTS_VIOLATION` | 400 | Rights validation failed |
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limiting

API endpoints are rate limited:

- **Free tier**: 10 requests per minute
- **Premium tier**: 100 requests per minute

Rate limit info is returned in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1685966400
```

## Webhook Events

Subscribe to webhook events for generation completion and status updates.

### Event: `music.generated`

Fired when a music generation completes.

```json
{
  "event": "music.generated",
  "timestamp": "2026-05-31T10:00:00Z",
  "data": {
    "artifactId": "artifact_xyz123",
    "userId": "user_123",
    "locale": "es-MX",
    "audioUrl": "https://storage.example.com/music/artifact_xyz123.mp3",
    "durationSeconds": 60
  }
}
```

## Example Workflows

### Complete Generation Workflow

```
1. POST /quotas/check → Check if generation is allowed
2. POST /rights/validate → Validate rights requirements
3. POST /generate → Create music artifact
4. POST /music-video/sessions → Create accompanying video
5. GET /library/:artifactId → View creation
```

### Remix Workflow

```
1. GET /library/shared → Browse artifacts
2. GET /library/:artifactId → Get artifact details
3. POST /quotas/check → Check quota
4. POST /library/:artifactId/remix → Create remix
5. GET /library/:remixId → View remix result
```

## Implementation Examples

See `/docs/EXAMPLES.md` for code samples in JavaScript, Python, and cURL.
