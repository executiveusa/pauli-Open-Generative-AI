# Music Studio Component API Reference

## Overview

This document describes the React components built for the Music Studio feature.

## Core Components

### QuotaDisplay

Displays user's remaining quota for music generation with progress bars and upgrade prompts.

**Location:** `/components/mol/QuotaDisplay.jsx`

**Props:**
```typescript
{
  usage?: {
    generationsUsed: number;
    minutesUsed: number;
  };
  tier?: 'free' | 'premium';
  onUpgrade?: () => void;
  compact?: boolean;
  locale?: 'en' | 'es';
}
```

**Example:**
```jsx
<QuotaDisplay
  usage={{ generationsUsed: 3, minutesUsed: 15 }}
  tier="free"
  onUpgrade={() => navigateToUpgrade()}
  locale="es"
/>
```

**Behavior:**
- Shows generation and minute quotas with color-coded progress bars
- Displays "Premium" badge for premium users
- Shows upgrade button when approaching limits (< 3 generations remaining)
- Compact mode shows single-line format

---

### RightsConsentPanel

Expandable panel for rights validation and consent management.

**Location:** `/components/mol/RightsConsentPanel.jsx`

**Props:**
```typescript
{
  violations?: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
    consentRequired?: string;
  }>;
  warnings?: Array<{
    field: string;
    message: string;
    severity: 'warning';
  }>;
  recommendations?: string[];
  requiredConsents?: Array<{
    type: string;
    label: string;
    description: string;
    required: boolean;
  }>;
  onConsentAccept?: (consentType: string) => void;
  locale?: 'en' | 'es';
}
```

**Example:**
```jsx
<RightsConsentPanel
  violations={violations}
  warnings={warnings}
  recommendations={recommendations}
  requiredConsents={consents}
  onConsentAccept={handleConsent}
  locale="en"
/>
```

**Behavior:**
- Red section for violations (errors)
- Yellow section for warnings
- Blue section for recommendations
- Checkboxes for consent acceptance
- Bilingual labels and descriptions

---

### BPMKeyDurationControls

Input controls for BPM, key, and duration with locale-specific validation.

**Location:** `/components/mol/BPMKeyDurationControls.jsx`

**Props:**
```typescript
{
  bpm?: number;
  key?: string;
  durationSeconds?: number;
  bpmRange?: [number, number];
  onBpmChange?: (bpm: number) => void;
  onKeyChange?: (key: string) => void;
  onDurationChange?: (seconds: number) => void;
  maxDurationSeconds?: number;
  locale?: 'en' | 'es';
}
```

**Example:**
```jsx
<BPMKeyDurationControls
  bpm={120}
  bpmRange={[90, 170]}
  maxDurationSeconds={60}
  onBpmChange={setBpm}
  locale="es"
/>
```

**Behavior:**
- Slider and input field for BPM with locale-specific min/max
- Dropdown for musical keys (C, D, E, etc.)
- Slider for duration with maximum limit
- Real-time validation against constraints

---

### MusicVideoSetup

Form for configuring music-to-video generation settings.

**Location:** `/components/mol/MusicVideoSetup.jsx`

**Props:**
```typescript
{
  musicArtifact?: {
    id: string;
    prompt: string;
    bpm: number;
    durationSeconds: number;
  };
  onAutoGenerate?: (prompt: string) => void;
  onCreate?: (config: {
    title: string;
    concept: string;
    visualStyle: string;
    colorPalette: string;
    cameraMovement: string;
    beatSyncIntensity: number;
  }) => void;
  locale?: 'en' | 'es';
}
```

**Example:**
```jsx
<MusicVideoSetup
  musicArtifact={artifact}
  onAutoGenerate={generatePrompt}
  onCreate={createVideoSession}
  locale="en"
/>
```

**Features:**
- Auto-generate video prompt from music metadata
- Visual style selection (6 options)
- Color palette picker (6 palettes)
- Camera movement presets (6 presets)
- Beat sync intensity slider (0-100%)
- Form validation before submission

---

### SharedArtifactLibrary

Browsable library of shared music artifacts with discovery and remix options.

**Location:** `/components/mol/SharedArtifactLibrary.jsx`

**Props:**
```typescript
{
  onSelect?: (artifact: any) => void;
  onRemix?: (artifact: any) => void;
  locale?: 'en' | 'es';
}
```

**Example:**
```jsx
<SharedArtifactLibrary
  onSelect={selectArtifact}
  onRemix={startRemix}
  locale="es"
/>
```

**Features:**
- Featured and Trending tabs
- Category filter (Electronic, Hip-Hop, Ambient, Jazz, Pop)
- Grid layout with artifact cards
- View and remix count display
- Featured indicator (★)
- Share and Remix action buttons
- Bilingual category labels

**Data Fetched:**
- GET `/api/v1/music/library/shared` on component mount

---

## Form Components

### MusicGenerationForm

Complete form for music generation with all parameters.

**Props:**
```typescript
{
  onSubmit?: (formData: MusicGenerationRequest) => Promise<void>;
  initialValues?: Partial<MusicGenerationRequest>;
  isLoading?: boolean;
  locale?: 'en' | 'es';
}
```

**Form Fields:**
- Prompt (text area)
- Locale selector (8 LatAm locales)
- BPM (slider + input)
- Duration (slider)
- Mode (select: simple, instrumental, lyrics, cover, remix)
- Genre (select)
- Mood (select)

**Validation:**
- BPM must be within locale-specific range
- Duration must not exceed tier limit
- Mode must be supported by user's tier
- Locale must be valid

---

## Page Components

### Music Generation Page

**Location:** `/app/mol/music/page.jsx`

**Structure:**
1. Header with UI language selector
2. Music Studio branding
3. Generation form (MusicGenerationForm)
4. Locale configuration display
5. BPM/Key/Duration controls (BPMKeyDurationControls)
6. Rights consent panel (RightsConsentPanel)
7. Quota display (QuotaDisplay)
8. History of generated tracks
9. Share/Download options

**Data Flow:**
```
User Input
    ↓
validateLocaleRequest()
    ↓
validateMusicRights()
    ↓
canGenerateInFreeTier()
    ↓
POST /api/v1/music/generate
    ↓
Display artifact with controls
```

---

### Music Video Page

**Location:** `/app/mol/music-video/page.jsx`

**Features:**
- Select or create music artifact
- Configure video settings (MusicVideoSetup)
- Generate video from music
- Display video output
- Share video

---

### Music Studio Landing Page

**Location:** `/app/mol/music-studio/page.jsx`

**Sections:**
1. Hero section with CTA
2. Features grid (6 key features)
3. Pricing tiers (Free vs Premium)
4. Workflow steps (5-step process)
5. Technology highlights
6. CTA footer
7. Footer navigation

**Bilingual Support:**
- English and Spanish labels
- Locale switcher in header
- All content translated

---

## Hook Utilities

### useMusicGeneration

Hook for managing music generation state and API calls.

```typescript
const {
  isLoading,
  error,
  artifact,
  generate,
} = useMusicGeneration();

// Usage
await generate({
  prompt: 'upbeat electronic',
  locale: 'es-MX',
  bpm: 120,
  durationSeconds: 60,
  mode: 'simple',
});
```

### useQuota

Hook for managing quota state.

```typescript
const {
  quota,
  tier,
  isLoading,
  checkAllowed,
  refreshQuota,
} = useQuota();

// Usage
const allowed = await checkAllowed({
  durationSeconds: 60,
  mode: 'simple',
  language: 'en',
});
```

### useLocalePreset

Hook for getting locale-specific configuration.

```typescript
const {
  preset,
  bpmRange,
  supportedModes,
  isLoading,
} = useLocalePreset('es-MX');
```

---

## Styling

All components use Tailwind CSS with the following color scheme:

### Free Tier
- Primary: `purple-500` / `purple-600`
- Accent: `pink-500` / `pink-600`
- Background: `slate-800` / `slate-900`

### Premium Tier
- Primary: `green-500`
- Background: Gradient overlay

### Status Colors
- Success: `green-400` / `green-600`
- Warning: `yellow-500`
- Error: `red-600`
- Info: `blue-400`

---

## Accessibility

All components include:
- ARIA labels for form inputs
- Semantic HTML structure
- Keyboard navigation support
- Color contrast compliance (WCAG AA)
- Focus indicators
- Screen reader friendly

---

## Responsive Design

Components adapt to breakpoints:
- Mobile: `sm` (640px)
- Tablet: `md` (768px)
- Desktop: `lg` (1024px)
- Large: `xl` (1280px)

Grid layouts:
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: 3+ columns

---

## Performance Considerations

### Optimization Techniques
1. **Code Splitting**: Components lazy-loaded with `React.lazy()`
2. **Memoization**: Expensive computations memoized with `useMemo`
3. **Debouncing**: Form inputs debounced (300ms)
4. **Image Optimization**: Audio placeholders use SVG
5. **Caching**: API responses cached in React Query

### Bundle Size
- Main bundle: ~150KB (gzipped)
- Music components: ~45KB (gzipped)

---

## Testing

### Unit Tests
Located in `packages/shared/src/music/__tests__/musicLogic.test.mjs`

20+ test cases covering:
- Locale presets validation
- BPM range enforcement
- Rights validation logic
- Quota calculations
- Artifact library operations
- Trending score calculations

### Integration Tests
Test complete user workflows:
1. Generate music from UI
2. Submit rights consent
3. Check quota before generation
4. Create music-to-video session
5. Share artifact with multi-tenant access

### E2E Tests
Test full application flows using Playwright or similar framework.

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Internationalization (i18n)

All components support English and Spanish with:
- `locale` prop for language selection
- Language-specific labels, error messages, tooltips
- Locale-specific number formatting (BPM, duration)
- RTL support ready for future languages

---

## Error Handling

Components provide user-friendly error messages:
- Validation errors: Inline field feedback
- API errors: Toast notifications or error panels
- Network errors: Retry options
- Quota errors: Upgrade prompts

---

## Future Enhancements

Planned component additions:
- Collaborative editing (multiple users on same project)
- Advanced audio visualization
- Real-time generation preview
- Voice recording/upload
- Stem separation UI
- Lyric editor
- Mood/vibe selector improvements
