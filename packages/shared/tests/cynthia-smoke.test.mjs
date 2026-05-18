import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = '/home/user/pauli-Open-Generative-AI';

describe('Phase 0-3 Infrastructure', () => {
  test('docs/cynthia-studio-build.md exists', () => {
    assert.ok(existsSync(join(ROOT, 'docs/cynthia-studio-build.md')));
  });
  test('docs/cynthia-studio-architecture.md exists', () => {
    assert.ok(existsSync(join(ROOT, 'docs/cynthia-studio-architecture.md')));
  });
  test('lib/i18n/index.js exists', () => {
    assert.ok(existsSync(join(ROOT, 'lib/i18n/index.js')));
  });
  test('lib/i18n/en.js exists', () => {
    assert.ok(existsSync(join(ROOT, 'lib/i18n/en.js')));
  });
  test('lib/i18n/es.js exists', () => {
    assert.ok(existsSync(join(ROOT, 'lib/i18n/es.js')));
  });
  test('lib/gateway/index.js exists', () => {
    assert.ok(existsSync(join(ROOT, 'lib/gateway/index.js')));
  });
  test('lib/gateway/adapters/MockAdapter.js exists', () => {
    assert.ok(existsSync(join(ROOT, 'lib/gateway/adapters/MockAdapter.js')));
  });
});

describe('Phase 1 Schemas', () => {
  test('packages/shared/src/schemas/cynthia.js exists', () => {
    assert.ok(existsSync(join(ROOT, 'packages/shared/src/schemas/cynthia.js')));
  });
  test('seed files exist', () => {
    assert.ok(existsSync(join(ROOT, 'packages/shared/src/schemas/seeds/character-example.json')));
    assert.ok(existsSync(join(ROOT, 'packages/shared/src/schemas/seeds/storyboard-example.json')));
  });
});

describe('Phase 4 Model Router', () => {
  test('supercomputer.js exists', () => {
    assert.ok(existsSync(join(ROOT, 'packages/shared/src/model-routing/supercomputer.js')));
  });
  test('app/api/v1/route/route.js exists', () => {
    assert.ok(existsSync(join(ROOT, 'app/api/v1/route/route.js')));
  });
  test('components/mol/SupercomputerPanel.jsx exists', () => {
    assert.ok(existsSync(join(ROOT, 'components/mol/SupercomputerPanel.jsx')));
  });
});

describe('Phase 5 Character Passport', () => {
  test('app/characters/page.jsx exists', () => {
    assert.ok(existsSync(join(ROOT, 'app/characters/page.jsx')));
  });
  test('app/characters/new/page.jsx exists', () => {
    assert.ok(existsSync(join(ROOT, 'app/characters/new/page.jsx')));
  });
  test('components/mol/CharacterPassportForm.jsx exists', () => {
    assert.ok(existsSync(join(ROOT, 'components/mol/CharacterPassportForm.jsx')));
  });
  test('app/api/v1/characters/route.js exists', () => {
    assert.ok(existsSync(join(ROOT, 'app/api/v1/characters/route.js')));
  });
});

describe('Phase 6 Hero Frame', () => {
  test('lib/prompts/heroFrameCompiler.js exists', () => {
    assert.ok(existsSync(join(ROOT, 'lib/prompts/heroFrameCompiler.js')));
  });
  test('app/mol/hero-frame/page.jsx exists', () => {
    assert.ok(existsSync(join(ROOT, 'app/mol/hero-frame/page.jsx')));
  });
});

describe('Phase 7 Storyboards', () => {
  test('app/storyboards/page.jsx exists', () => {
    assert.ok(existsSync(join(ROOT, 'app/storyboards/page.jsx')));
  });
  test('app/storyboards/[id]/page.jsx exists', () => {
    assert.ok(existsSync(join(ROOT, 'app/storyboards/[id]/page.jsx')));
  });
  test('app/api/v1/storyboards/route.js exists', () => {
    assert.ok(existsSync(join(ROOT, 'app/api/v1/storyboards/route.js')));
  });
  test('components/mol/CameraPresetSelector.jsx exists', () => {
    assert.ok(existsSync(join(ROOT, 'components/mol/CameraPresetSelector.jsx')));
  });
});

describe('Phase 8 Cine Studio', () => {
  test('app/mol/cine-studio/page.jsx exists', () => {
    assert.ok(existsSync(join(ROOT, 'app/mol/cine-studio/page.jsx')));
  });
});

describe('Phase 9 Talking Character', () => {
  test('app/mol/talking-character/page.jsx exists', () => {
    assert.ok(existsSync(join(ROOT, 'app/mol/talking-character/page.jsx')));
  });
  test('app/api/v1/lipsync/route.js exists', () => {
    assert.ok(existsSync(join(ROOT, 'app/api/v1/lipsync/route.js')));
  });
});

describe('Phase 10 Jobs', () => {
  test('lib/jobs/client.js exists', () => {
    assert.ok(existsSync(join(ROOT, 'lib/jobs/client.js')));
  });
  test('app/mol/jobs/page.jsx exists', () => {
    assert.ok(existsSync(join(ROOT, 'app/mol/jobs/page.jsx')));
  });
});

describe('Phase 11 Consent', () => {
  test('lib/consent/index.js exists', () => {
    assert.ok(existsSync(join(ROOT, 'lib/consent/index.js')));
  });
  test('components/mol/ConsentModal.jsx exists', () => {
    assert.ok(existsSync(join(ROOT, 'components/mol/ConsentModal.jsx')));
  });
});

describe('Phase 12 Evaluation', () => {
  test('lib/evaluation/index.js exists', () => {
    assert.ok(existsSync(join(ROOT, 'lib/evaluation/index.js')));
  });
  test('components/mol/EvaluationPanel.jsx exists', () => {
    assert.ok(existsSync(join(ROOT, 'components/mol/EvaluationPanel.jsx')));
  });
});

describe('Phase 13 Landing', () => {
  test('app/landing/page.jsx exists', () => {
    assert.ok(existsSync(join(ROOT, 'app/landing/page.jsx')));
  });
});

describe('Phase 14 BYOK', () => {
  test('app/settings/providers/page.jsx exists', () => {
    assert.ok(existsSync(join(ROOT, 'app/settings/providers/page.jsx')));
  });
  test('app/api/v1/keys/route.js exists', () => {
    assert.ok(existsSync(join(ROOT, 'app/api/v1/keys/route.js')));
  });
});

describe('Phase 16 Gateway Contract', () => {
  test('docs/cynthia-gateway-contract.md exists', () => {
    assert.ok(existsSync(join(ROOT, 'docs/cynthia-gateway-contract.md')));
  });
});
