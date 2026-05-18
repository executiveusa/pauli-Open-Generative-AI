import { NextResponse } from 'next/server';

/**
 * Mock provider key test function
 */
async function testProviderKey(provider, key) {
  // In production, this would make actual API calls to test the key
  // For now, return a mock success response

  if (!key || key.length < 10) {
    return {
      success: false,
      error: 'Invalid key format',
    };
  }

  // Simulate different provider validation behaviors
  const tests = {
    openai: () => ({
      success: true,
      model: 'gpt-4',
      credits: 'Requires valid billing account',
    }),
    anthropic: () => ({
      success: true,
      model: 'claude-3-opus',
      credits: 'Requires valid billing account',
    }),
    runwayml: () => ({
      success: true,
      plan: 'Standard',
      credits: 100,
    }),
    replicate: () => ({
      success: true,
      username: 'user',
      isPaid: true,
    }),
    elevenlabs: () => ({
      success: true,
      voiceCount: 5,
      characterLimit: 10000,
    }),
    google: () => ({
      success: true,
      project: 'project-id',
      quota: 'Standard',
    }),
    together: () => ({
      success: true,
      balance: 100,
      status: 'active',
    }),
    mistral: () => ({
      success: true,
      models: ['mistral-7b', 'mistral-medium'],
      quota: 'Standard',
    }),
  };

  const testFn = tests[provider];
  if (testFn) {
    return testFn();
  }

  return {
    success: true,
    message: 'Key is valid',
  };
}

/**
 * POST /api/v1/keys/test
 * Tests a provider key.
 * Body: { provider, key }
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON' }, { status: 400 });
  }

  const { provider, key } = body;

  // Validate required fields
  if (!provider) {
    return NextResponse.json(
      { error: 'validation_error', message: 'provider is required', errors: ['missing provider'] },
      { status: 400 }
    );
  }

  if (!key) {
    return NextResponse.json(
      { error: 'validation_error', message: 'key is required', errors: ['missing key'] },
      { status: 400 }
    );
  }

  // IMPORTANT: Never log actual key - use placeholder
  console.log(`[keys/test POST] Testing key for provider: ${provider} [REDACTED]`);

  try {
    const result = await testProviderKey(provider, key);
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Key test failed',
        },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error('[keys/test POST] error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test key',
      },
      { status: 500 }
    );
  }
}
