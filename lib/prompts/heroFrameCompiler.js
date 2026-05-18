/**
 * heroFrameCompiler.js — compiles hero frame generation prompts.
 * Takes character, location, aspect ratio, camera preset, and language.
 * Returns bilingual prompts, negative prompts, continuity locks, and debug tokens.
 */

/**
 * Compile a hero frame generation prompt.
 * @param {{
 *   character: object,
 *   location: string,
 *   aspectRatio: string,
 *   cameraPreset: string,
 *   language: 'en'|'es'
 * }} options
 * @returns {{
 *   englishPrompt: string,
 *   spanishPrompt: string,
 *   providerPrompt: string,
 *   negativePrompt: string,
 *   negativePromptEs: string,
 *   continuityLocks: object,
 *   debugTokens: object
 * }}
 */
export function compileHeroFrame(options = {}) {
  const {
    character = {},
    location = '',
    aspectRatio = '16:9',
    cameraPreset = 'medium-shot',
    language = 'en',
  } = options;

  // Extract character properties
  const characterName = character.publicName || 'Character';
  const archetype = character.archetype || '';
  const bodyType = character.bodyType || '';
  const facialDescription = character.facialDescription || '';
  const hairDescription = character.hairDescription || '';
  const skinTone = character.skinTone || '';
  const wardrobeCore = character.wardrobeCore || '';
  const accessories = character.accessories || '';
  const personalityTraits = Array.isArray(character.personalityTraits)
    ? character.personalityTraits.join(', ')
    : character.personalityTraits || '';

  // Camera mapping
  const CAMERA_PROMPTS = {
    'close-up': { en: 'tight close-up on face showing emotion', es: 'primer plano cerrado del rostro mostrando emoción' },
    'medium-shot': { en: 'medium shot waist-up framing, ideal for dialogue', es: 'plano medio desde cintura, ideal para diálogo' },
    'wide-shot': { en: 'wide shot showing full body and environment', es: 'plano general mostrando cuerpo completo y entorno' },
    'handheld-documentary': { en: 'handheld documentary style with natural movement', es: 'estilo documental en mano con movimiento natural' },
    'dolly-in': { en: 'camera moves toward subject building intensity', es: 'cámara se acerca al sujeto aumentando intensidad' },
    'dolly-out': { en: 'camera pulls back to reveal context', es: 'cámara se aleja para revelar contexto' },
    'orbit': { en: 'camera circles around subject 180 degrees', es: 'cámara orbita alrededor del sujeto 180 grados' },
    'crane-up': { en: 'camera rises vertically revealing scale', es: 'cámara asciende verticalmente revelando escala' },
    'tracking-shot': { en: 'camera follows subject laterally', es: 'cámara sigue al sujeto lateralmente' },
    'over-the-shoulder': { en: 'framing over shoulder for conversation', es: 'encuadre por sobre el hombro para conversación' },
    'telenovela-dramatic-push-in': { en: 'telenovela dramatic slow push-in to face', es: 'acercamiento dramático lento de telenovela al rostro' },
    'music-video-handheld': { en: 'music video handheld cinematic style', es: 'estilo cinematográfico en mano de videoclip' },
  };

  const cameraPromptEn = CAMERA_PROMPTS[cameraPreset]?.en || CAMERA_PROMPTS['medium-shot'].en;
  const cameraPromptEs = CAMERA_PROMPTS[cameraPreset]?.es || CAMERA_PROMPTS['medium-shot'].es;

  // Build English prompt
  const englishPrompt = [
    `Character portrait of ${characterName}`,
    `Archetype: ${archetype}`,
    facialDescription ? `Face: ${facialDescription}` : '',
    hairDescription ? `Hair: ${hairDescription}` : '',
    skinTone ? `Skin: ${skinTone}` : '',
    wardrobeCore ? `Wearing: ${wardrobeCore}` : '',
    accessories ? `Accessories: ${accessories}` : '',
    personalityTraits ? `Personality: ${personalityTraits}` : '',
    `Camera: ${cameraPromptEn}`,
    location ? `Setting: ${location}` : '',
    `Aspect ratio ${aspectRatio}`,
    'Professional lighting, cinematic quality',
    'Sharp focus, highly detailed, photorealistic',
  ]
    .filter(Boolean)
    .join(', ');

  // Build Spanish prompt
  const spanishPrompt = [
    `Retrato del personaje ${characterName}`,
    `Arquetipo: ${archetype}`,
    facialDescription ? `Rostro: ${facialDescription}` : '',
    hairDescription ? `Cabello: ${hairDescription}` : '',
    skinTone ? `Piel: ${skinTone}` : '',
    wardrobeCore ? `Vistiendo: ${wardrobeCore}` : '',
    accessories ? `Accesorios: ${accessories}` : '',
    personalityTraits ? `Personalidad: ${personalityTraits}` : '',
    `Cámara: ${cameraPromptEs}`,
    location ? `Escenario: ${location}` : '',
    `Relación de aspecto ${aspectRatio}`,
    'Iluminación profesional, calidad cinematográfica',
    'Enfoque nítido, altamente detallado, fotorrealista',
  ]
    .filter(Boolean)
    .join(', ');

  // Provider prompt (extended for maximum quality)
  const providerPrompt = [
    englishPrompt,
    'by professional character designer',
    'volumetric lighting, subsurface scattering',
    'color grading, film grain',
    'award-winning cinematography',
  ].join(', ');

  // Hardcoded negative prompts
  const negativePrompt = [
    'blurry, out of focus, low quality',
    'distorted face, malformed features',
    'text, watermark, logo',
    'low resolution, grainy',
    'cartoon, anime, illustration',
    'duplicate, symmetrical face',
    'unnatural skin texture',
    'oversaturated colors',
    'plastic appearance',
    'bad anatomy, extra limbs',
    'cross-eyed, lazy eye',
    'distorted proportions',
    'unnatural pose',
    'bad hands, extra fingers',
    'nsfw, explicit content',
  ].join(', ');

  const negativePromptEs = [
    'borroso, fuera de foco, baja calidad',
    'rostro distorsionado, rasgos malformados',
    'texto, marca de agua, logo',
    'baja resolución, granulado',
    'caricatura, anime, ilustración',
    'rostro duplicado, simétrico',
    'textura de piel antinatural',
    'colores sobresaturados',
    'aspecto plástico',
    'anatomía mala, extremidades extra',
    'ojos cruzados, ojo perezoso',
    'proporciones desnaturales',
    'pose antinatural',
    'manos malas, dedos extra',
    'contenido explícito, inapropiado',
  ].join(', ');

  // Continuity locks
  const continuityLocks = {
    face: character.continuityLocks?.face ?? true,
    hair: character.continuityLocks?.hair ?? true,
    wardrobe: character.continuityLocks?.wardrobe ?? false,
    bodyType: character.continuityLocks?.bodyType ?? true,
  };

  // Debug tokens
  const debugTokens = {
    characterTokens: (characterName.split(' ').length * 2) + 50,
    locationTokens: location.split(' ').length * 3,
    cameraTokens: 15,
    totalEstimate: 200,
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

export default { compileHeroFrame };
