import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateCharacterPassport, validateGenerationJob, validateLocalePack, validateStoryboard } from '../src/schemas/cynthiaSchemas.js';

const character = JSON.parse(readFileSync(new URL('../src/schemas/seeds/character-passport.example.json', import.meta.url)));
const storyboard = JSON.parse(readFileSync(new URL('../src/schemas/seeds/storyboard.example.json', import.meta.url)));

test('valid character passport example passes', () => {
  assert.doesNotThrow(() => validateCharacterPassport(character));
});

test('invalid character passport fails', () => {
  const invalid = { ...character, publicName: '' };
  assert.throws(() => validateCharacterPassport(invalid));
});

test('valid storyboard example passes', () => {
  assert.doesNotThrow(() => validateStoryboard(storyboard));
});

test('locale pack and generation job schemas pass/fail checks', () => {
  assert.doesNotThrow(() => validateLocalePack({ id: 'latam-es', language: 'es', region: 'LATAM', labels: { create: 'Crear' } }));
  assert.throws(() => validateGenerationJob({ id: 'job1', type: 'image' }));
});
