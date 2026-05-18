/**
 * Hero Frame Prompt Compiler
 * Generates bilingual prompts, metadata, and continuity locks for hero frame generation.
 *
 * @param {object} options - Compilation options
 * @param {object} options.character - Character passport object
 * @param {string} options.location - Location description
 * @param {string} options.aspectRatio - Target aspect ratio (e.g., '16:9')
 * @param {object} options.cameraPreset - Camera preset object with framingType, movement
 * @param {string} options.language - Language code ('en' or 'es')
 * @returns {object} Compiled prompt bundle
 */
export function compileHeroFrame({
  character,
  location,
  aspectRatio = '16:9',
  cameraPreset = {},
  language = 'en',
} = {}) {
  const isSpanish = language === 'es';

  // Sanitize inputs
  const charName = character?.publicName || 'Character';
  const charArchetype = character?.archetype || 'protagonist';
  const charLocale = character?.locale || 'en-US';
  const promptAnchor = character?.promptAnchor || 'a person';
  const voiceLocale = character?.voiceLocale || 'en-US';

  const cameraFraming = cameraPreset?.framingType || 'MS';
  const cameraMovement = cameraPreset?.movement || 'static';
  const fps = 24;

  // Build core prompt in English
  const englishPrompt = buildEnglishPrompt({
    charName,
    charArchetype,
    promptAnchor,
    location,
    cameraFraming,
    cameraMovement,
    aspectRatio,
    fps,
  });

  // Build Spanish version
  const spanishPrompt = buildSpanishPrompt({
    charName,
    charArchetype,
    promptAnchor,
    location,
    cameraFraming,
    cameraMovement,
    aspectRatio,
    fps,
  });

  // Hardcoded negative prompts as specified
  const negativePrompt = NEGATIVE_PROMPT_EN;
  const negativePromptEs = NEGATIVE_PROMPT_ES;

  // Build provider-optimized version (for third-party APIs)
  const providerPrompt = buildProviderPrompt(englishPrompt, cameraPreset);

  // Continuity locks
  const continuityLocks = {
    characterId: character?.id,
    characterName: charName,
    archetype: charArchetype,
    locale: charLocale,
    voiceLocale,
    promptAnchors: [promptAnchor],
    triggerWords: character?.triggerWords || [],
    faceLock: character?.continuityRules?.face,
    wardrobeLock: character?.continuityRules?.wardrobe,
    colorPalette: character?.continuityRules?.colors || [],
  };

  // Debug tokens for testing
  const debugTokens = {
    timestamp: new Date().toISOString(),
    modelVersion: 'v1',
    compilationMode: 'hero-frame',
    targetLanguage: language,
    aspectRatio,
    cameraPreset: cameraPreset?.id,
  };

  return {
    englishPrompt,
    spanishPrompt,
    providerPrompt,
    negativePrompt,
    negativePromptEs,
    continuityLocks,
    debugTokens,
  };
}

/**
 * Build English hero frame prompt
 */
function buildEnglishPrompt({
  charName,
  charArchetype,
  promptAnchor,
  location,
  cameraFraming,
  cameraMovement,
  aspectRatio,
  fps,
}) {
  const framing = FRAMING_DESCRIPTIONS_EN[cameraFraming] || 'medium shot';
  const movement = MOVEMENT_DESCRIPTIONS_EN[cameraMovement] || 'static';

  const prompt = `
Professional cinematic hero frame featuring ${charName}, a ${charArchetype} character.

**Character Description:**
${promptAnchor}

**Setting:**
${location || 'professional studio with dramatic lighting'}

**Visual Direction:**
- ${framing}
- ${movement}
- Professional color grading
- Cinema 4K quality
- Natural skin tones, sharp focus on face
- Aspect ratio: ${aspectRatio}
- Frame rate: ${fps} fps

**Mood & Tone:**
Compelling hero introduction moment. Dynamic, professional, ready-for-action.

**Technical Requirements:**
- Cinematic lighting
- Sharp focus on character
- Rich color depth
- No visible artifacts or distortion
- Professional production quality
  `.trim();

  return prompt;
}

/**
 * Build Spanish hero frame prompt
 */
function buildSpanishPrompt({
  charName,
  charArchetype,
  promptAnchor,
  location,
  cameraFraming,
  cameraMovement,
  aspectRatio,
  fps,
}) {
  const framing = FRAMING_DESCRIPTIONS_ES[cameraFraming] || 'plano medio';
  const movement = MOVEMENT_DESCRIPTIONS_ES[cameraMovement] || 'estático';

  const prompt = `
Marco héroe cinematográfico profesional que presenta a ${charName}, un personaje ${charArchetype}.

**Descripción del Personaje:**
${promptAnchor}

**Escenario:**
${location || 'estudio profesional con iluminación dramática'}

**Dirección Visual:**
- ${framing}
- ${movement}
- Calibración de color profesional
- Calidad Cinema 4K
- Tonos de piel naturales, enfoque nítido en el rostro
- Relación de aspecto: ${aspectRatio}
- Velocidad de fotogramas: ${fps} fps

**Ambiente y Tono:**
Momento de introducción heroica convincente. Dinámico, profesional, listo para la acción.

**Requisitos Técnicos:**
- Iluminación cinematográfica
- Enfoque nítido en el personaje
- Profundidad de color rica
- Sin artefactos visibles ni distorsión
- Calidad de producción profesional
  `.trim();

  return prompt;
}

/**
 * Build provider-optimized prompt (removes formatting, optimized for APIs)
 */
function buildProviderPrompt(basePrompt, cameraPreset) {
  // Remove markdown formatting and consolidate
  return basePrompt
    .replace(/##\s+/g, '')
    .replace(/\*\*/g, '')
    .replace(/\n\n+/g, '. ')
    .replace(/\n-\s+/g, ', ')
    .trim();
}

/**
 * Hardcoded negative prompt in English
 * Covers quality, anatomy, artifacts, unwanted styles
 */
const NEGATIVE_PROMPT_EN = `
blurry, out of focus, low resolution, pixelated, jpeg artifacts, compression artifacts,
distorted face, disfigured face, extra fingers, missing fingers, bad anatomy, malformed body,
extra limbs, missing limbs, contorted limbs, twisted torso, unnatural pose,
poorly drawn, crude, ugly, deformed, grotesque, monstrosity,
bad eyes, crossed eyes, lazy eye, strabismus, drooping eyes, bulging eyes,
bad mouth, too many teeth, missing teeth, crooked teeth, bad smile,
bad nose, crooked nose, deformed nose, too large nose, too small nose,
bad hands, poorly drawn hands, twisted hands, claw hands, webbed fingers,
bad feet, poorly drawn feet, twisted feet, clubfoot,
watermark, signature, text, logo, username,
oversaturated, washed out, flat, lifeless, dead eyes, vacant stare,
double exposure, ghosting, smearing, motion blur beyond intent,
unnatural skin tone, orange skin, gray skin, lifeless complexion,
oil painting artifacts, sketch style, cartoon, anime, painted style,
low quality background, out of place objects, floating objects,
harsh shadows, overexposed, underexposed, blown highlights,
amateur lighting, flat lighting, one-dimensional lighting,
duplicate subject, multiple bodies, two heads, body horror,
tiling artifacts, pattern repetition, obvious AI artifacts,
lens distortion excessive, fisheye distortion, barrel distortion,
chromatic aberration excessive, color fringing, noise grain excessive,
deepfake look, uncanny valley, plastic skin, doll-like, mannequin,
unnatural hair, hair loss patches, bald spots in wrong places,
clothing distortion, fabric clipping, impossible fabric folds,
symmetry excessive, too perfect, unnatural symmetry,
green screen visible, background glitch, clipping errors,
institutional setting, prison, medical facility unless specifically requested,
sad, depressed, anxious, angry, evil, malicious expression,
nude, partially nude, sexual, suggestive pose or appearance,
corpse, dead, decaying, gore, blood, violence,
alcohol, cigarettes, drugs, weapons in threatening context,
logos, brand names, trademarks visible,
children in inappropriate contexts, minors in adult situations
`.split(',').map(s => s.trim()).filter(Boolean).join(', ');

/**
 * Hardcoded negative prompt in Spanish
 * Matches English but in Spanish
 */
const NEGATIVE_PROMPT_ES = `
borroso, desenfocado, baja resolución, pixelado, artefactos jpeg, artefactos de compresión,
rostro distorsionado, rostro desfigurado, dedos adicionales, dedos faltantes, mala anatomía, cuerpo deformado,
extremidades adicionales, extremidades faltantes, extremidades contorsionadas, torso retorcido, postura antinatural,
mal dibujado, tosco, feo, deformado, grotesco, monstruosidad,
ojos malos, ojos cruzados, ojo perezoso, estrabismo, ojos caídos, ojos saltones,
boca mala, demasiados dientes, dientes faltantes, dientes torcidos, sonrisa mala,
nariz mala, nariz torcida, nariz deformada, nariz demasiado grande, nariz demasiado pequeña,
manos malas, manos mal dibujadas, manos retorcidas, manos de garra, dedos palmeados,
pies malos, pies mal dibujados, pies retorcidos, pie zambo,
marca de agua, firma, texto, logo, nombre de usuario,
sobresaturado, decolorado, plano, sin vida, ojos muertos, mirada vacía,
doble exposición, fantasma, manchado, desenfoqueante, desenfoque de movimiento más allá de lo intencionado,
tono de piel antinatural, piel naranja, piel gris, complexión sin vida,
artefactos de pintura al óleo, estilo de bosquejo, caricatura, anime, estilo pintado,
fondo de baja calidad, objetos fuera de lugar, objetos flotantes,
sombras duras, sobreexpuesto, subexpuesto, destacados quemados,
iluminación amateur, iluminación plana, iluminación unidimensional,
tema duplicado, múltiples cuerpos, dos cabezas, body horror,
artefactos de mosaico, repetición de patrón, artefactos obvios de IA,
distorsión de lente excesiva, distorsión ojo de pez, distorsión de barril,
aberración cromática excesiva, franja de color, grano de ruido excesivo,
aspecto deepfake, uncanny valley, piel plástica, parecido a muñeca, maniquí,
pelo antinatural, parches de pérdida de cabello, calvicie en lugares incorrectos,
distorsión de ropa, clipping de tela, pliegues de tela imposibles,
simetría excesiva, demasiado perfecto, simetría antinatural,
pantalla verde visible, glitch de fondo, errores de clipping,
ambiente institucional, prisión, instalación médica a menos que se solicite específicamente,
triste, deprimido, ansioso, enojado, malvado, expresión maliciosa,
desnudo, parcialmente desnudo, sexual, pose o apariencia sugerente,
cadáver, muerto, descomposición, gore, sangre, violencia,
alcohol, cigarrillos, drogas, armas en contexto amenazante,
logos, nombres de marca, marcas registradas visibles,
niños en contextos inapropiados, menores en situaciones para adultos
`.split(',').map(s => s.trim()).filter(Boolean).join(', ');

/**
 * Camera framing descriptions in English
 */
const FRAMING_DESCRIPTIONS_EN = {
  CU: 'Tight close-up framing on the face, emphasizing features and expression',
  MS: 'Medium shot from waist up, professional and balanced',
  WS: 'Wide shot showing full body and environment',
  OTS: 'Over-the-shoulder framing showing character in space',
  ECU: 'Extreme close-up capturing fine details and emotion',
};

/**
 * Camera movement descriptions in English
 */
const MOVEMENT_DESCRIPTIONS_EN = {
  static: 'Static, locked camera shot',
  'handheld': 'Handheld, subtle natural movement',
  'dolly-in': 'Smooth dolly in, building intensity',
  'dolly-out': 'Smooth dolly out, revealing context',
  orbit: 'Orbital camera movement, 180-degree arc',
  'slow-push-in': 'Slow dramatic push in',
  tracking: 'Lateral tracking shot following the subject',
  'crane-up': 'Vertical crane movement upward',
};

/**
 * Camera framing descriptions in Spanish
 */
const FRAMING_DESCRIPTIONS_ES = {
  CU: 'Encuadre cerrado de primer plano en el rostro, enfatizando características y expresión',
  MS: 'Plano medio de cintura hacia arriba, profesional y equilibrado',
  WS: 'Plano general mostrando cuerpo completo y ambiente',
  OTS: 'Encuadre por encima del hombro mostrando el personaje en el espacio',
  ECU: 'Plano muy cerrado capturando detalles finos y emoción',
};

/**
 * Camera movement descriptions in Spanish
 */
const MOVEMENT_DESCRIPTIONS_ES = {
  static: 'Estático, toma de cámara bloqueada',
  'handheld': 'Handheld, movimiento natural sutil',
  'dolly-in': 'Travelling suave de acercamiento, aumentando intensidad',
  'dolly-out': 'Travelling suave de alejamiento, revelando contexto',
  orbit: 'Movimiento orbital de cámara, arco de 180 grados',
  'slow-push-in': 'Acercamiento dramático lento',
  tracking: 'Toma de seguimiento lateral siguiendo al sujeto',
  'crane-up': 'Movimiento de grúa vertical hacia arriba',
};
