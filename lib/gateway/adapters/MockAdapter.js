/**
 * Mock Provider Adapter - Simulates provider responses for testing
 */

export class MockAdapter {
  constructor(config = {}) {
    this.config = config;
    this.jobs = new Map();
  }

  /**
   * Generate content (simulated)
   * @param {object} params - Generation parameters
   * @returns {Promise<object>} Mock response
   */
  async generate(params) {
    // Simulate network delay (100-500ms)
    await new Promise(resolve =>
      setTimeout(resolve, 100 + Math.random() * 400)
    );

    const jobId = `mock-job-${Date.now()}`;
    const response = {
      jobId,
      status: 'queued',
      provider: 'mock',
      artifact: {
        type: params.type || 'image',
        url: `mock://artifact/${jobId}`,
        format: params.format || 'url',
      },
      metadata: {
        model: params.model || 'mock-model',
        provider: 'mock',
        createdAt: new Date().toISOString(),
      },
    };

    this.jobs.set(jobId, response);
    return response;
  }

  /**
   * Get job status (simulated)
   * @param {string} jobId - Job ID
   * @returns {Promise<object>} Job status
   */
  async getJob(jobId) {
    await new Promise(resolve => setTimeout(resolve, 50));

    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    // Simulate job progression
    const elapsed = Date.now() - parseInt(jobId.split('-')[2]);
    let status = 'queued';
    if (elapsed > 1000) status = 'running';
    if (elapsed > 3000) status = 'succeeded';

    return { ...job, status };
  }

  /**
   * List available models (simulated)
   * @returns {Promise<array>} Available models
   */
  async listModels() {
    await new Promise(resolve => setTimeout(resolve, 50));

    return [
      {
        id: 'mock-image-v1',
        name: 'Mock Image Model v1',
        type: 'image',
        capabilities: ['image-generation', 'image-editing'],
        costPer1kTokens: 0.001,
      },
      {
        id: 'mock-video-v1',
        name: 'Mock Video Model v1',
        type: 'video',
        capabilities: ['video-generation'],
        costPer1kTokens: 0.01,
      },
      {
        id: 'mock-text-v1',
        name: 'Mock Text Model v1',
        type: 'text',
        capabilities: ['text-generation', 'text-editing'],
        costPer1kTokens: 0.0001,
      },
    ];
  }

  /**
   * Evaluate content (simulated)
   * @param {object} params - Evaluation parameters
   * @returns {Promise<object>} Evaluation result
   */
  async evaluate(params) {
    await new Promise(resolve =>
      setTimeout(resolve, 200 + Math.random() * 300)
    );

    return {
      jobId: params.jobId,
      scores: {
        quality: 0.85,
        consistency: 0.90,
        safety: 0.95,
      },
      passed: true,
      recommendations: [],
    };
  }

  /**
   * Test provider credentials (simulated)
   * @returns {Promise<object>} Test result
   */
  async testKey() {
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      valid: true,
      message: 'Mock provider is always valid',
    };
  }

  /**
   * Route request (simulated)
   * @param {object} params - Routing parameters
   * @returns {Promise<object>} Routed response
   */
  async route(params) {
    return this.generate(params);
  }

  /**
   * Set provider configuration
   * @param {object} config - Configuration object
   */
  setConfig(config) {
    this.config = config;
  }
}

export default MockAdapter;
