const requiredString = (obj, key, path) => {
  const value = obj?.[key];
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${path}.${key} must be a non-empty string`);
  return value;
};

const requiredArray = (obj, key, path) => {
  const value = obj?.[key];
  if (!Array.isArray(value)) throw new Error(`${path}.${key} must be an array`);
  return value;
};

const requiredObject = (obj, key, path) => {
  const value = obj?.[key];
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path}.${key} must be an object`);
  return value;
};

export function validateCharacterPassport(passport) {
  requiredString(passport, 'id', 'characterPassport');
  requiredString(passport, 'publicName', 'characterPassport');
  requiredString(passport, 'locale', 'characterPassport');
  requiredString(passport, 'archetype', 'characterPassport');
  requiredObject(passport, 'visualIdentity', 'characterPassport');
  requiredArray(passport, 'wardrobe', 'characterPassport');
  requiredObject(passport, 'personality', 'characterPassport');
  requiredString(passport, 'backstory', 'characterPassport');
  requiredObject(passport, 'voiceProfile', 'characterPassport');
  requiredArray(passport, 'referenceAssets', 'characterPassport');
  requiredObject(passport, 'continuityLocks', 'characterPassport');
  requiredObject(passport, 'rights', 'characterPassport');
  requiredArray(passport, 'safetyFlags', 'characterPassport');
  requiredString(passport, 'createdAt', 'characterPassport');
  requiredString(passport, 'updatedAt', 'characterPassport');
  return passport;
}

export function validateShot(shot) {
  ['id','action','cameraPreset','motionPreset','lens','focalLength','emotionalBeat','dialogue'].forEach((k) => requiredString(shot, k, 'shot'));
  if (typeof shot?.order !== 'number') throw new Error('shot.order must be a number');
  requiredString(shot, 'startFrameArtifactId', 'shot');
  requiredString(shot, 'endFrameArtifactId', 'shot');
  requiredObject(shot, 'continuityLocks', 'shot');
  requiredObject(shot, 'modelPreference', 'shot');
  return shot;
}

export function validateStoryboard(storyboard) {
  ['id','title','language','locale','targetAspectRatio','continuityMode'].forEach((k) => requiredString(storyboard, k, 'storyboard'));
  requiredArray(storyboard, 'characters', 'storyboard');
  requiredArray(storyboard, 'locations', 'storyboard');
  const shots = requiredArray(storyboard, 'shots', 'storyboard');
  if (typeof storyboard?.durationSeconds !== 'number') throw new Error('storyboard.durationSeconds must be a number');
  shots.forEach(validateShot);
  return storyboard;
}

export function validateLocalePack(localePack) {
  requiredString(localePack, 'id', 'localePack');
  requiredString(localePack, 'language', 'localePack');
  requiredString(localePack, 'region', 'localePack');
  requiredObject(localePack, 'labels', 'localePack');
  return localePack;
}

export function validateGenerationJob(job) {
  requiredString(job, 'id', 'generationJob');
  requiredString(job, 'type', 'generationJob');
  requiredString(job, 'status', 'generationJob');
  requiredObject(job, 'input', 'generationJob');
  requiredArray(job, 'artifacts', 'generationJob');
  return job;
}
