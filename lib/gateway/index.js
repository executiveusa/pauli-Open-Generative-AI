/**
 * Cynthia Gateway - Multi-provider AI model gateway client.
 * Orchestrates requests across multiple providers with error handling and routing.
 */

import MockAdapter from './adapters/MockAdapter.js';
import CynthiaGatewayAdapter from './adapters/CynthiaGatewayAdapter.js';
import OpenAIAdapter from './adapters/OpenAIAdapter.js';
import MuAPIAdapter from './adapters/MuAPIAdapter.js';
import LocalAdapter from './adapters/LocalAdapter.js';
import NIMAdapter from './adapters/NIMAdapter.js';

/**
 * GatewayClient - Main gateway orchestrator
 */
export class GatewayClient {
  constructor(config = {}) {
    this.config = {
      mock: false,
      providers: {},
      ...config,
    };

    // Initialize adapters
    this.adapters = {
      mock: new MockAdapter(),
      nim: new NIMAdapter(config.providers?.nim),
      cynthiaGateway: new CynthiaGatewayAdapter(config.providers?.cynthiaGateway),
      openai: new OpenAIAdapter(config.providers?.openai),
      muapi: new MuAPIAdapter(config.providers?.muapi),
      local: new LocalAdapter(config.providers?.local),
    };
  }

  /**
   * Get the appropriate adapter for a provider
   * @param {string} provider - Provider name
   * @returns {object} Adapter instance
   */
  getAdapter(provider) {
    if (this.config.mock) {
      return this.adapters.mock;
    }

    const adapter = this.adapters[provider];
    if (!adapter) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    return adapter;
  }

  /**
   * Generate content through the specified provider
   * @param {string} provider - Provider name (openai, muapi, cynthiaGateway, local)
   * @param {object} params - Generation parameters
   * @returns {Promise<object>} Generation result
   */
  async generate(provider, params) {
    try {
      const adapter = this.getAdapter(provider);
      return await adapter.generate(params);
    } catch (error) {
      throw new Error(`Generation failed with ${provider}: ${error.message}`);
    }
  }

  /**
   * Get status of a generation job
   * @param {string} provider - Provider name
   * @param {string} jobId - Job ID
   * @returns {Promise<object>} Job status
   */
  async getJob(provider, jobId) {
    try {
      const adapter = this.getAdapter(provider);
      return await adapter.getJob(jobId);
    } catch (error) {
      throw new Error(`Failed to get job status: ${error.message}`);
    }
  }

  /**
   * List available models from a provider
   * @param {string} provider - Provider name
   * @returns {Promise<array>} List of available models
   */
  async listModels(provider) {
    try {
      const adapter = this.getAdapter(provider);
      return await adapter.listModels();
    } catch (error) {
      throw new Error(`Failed to list models: ${error.message}`);
    }
  }

  /**
   * Evaluate generated content
   * @param {string} provider - Provider name
   * @param {object} params - Evaluation parameters
   * @returns {Promise<object>} Evaluation result
   */
  async evaluate(provider, params) {
    try {
      const adapter = this.getAdapter(provider);
      return await adapter.evaluate(params);
    } catch (error) {
      throw new Error(`Evaluation failed: ${error.message}`);
    }
  }

  /**
   * Test if provider credentials are valid
   * @param {string} provider - Provider name
   * @returns {Promise<object>} Test result {valid: boolean, message?: string}
   */
  async testKey(provider) {
    try {
      const adapter = this.getAdapter(provider);
      return await adapter.testKey();
    } catch (error) {
      return { valid: false, message: error.message };
    }
  }

  /**
   * Route a request to the best provider
   * @param {object} params - Request parameters with routing constraints
   * @returns {Promise<object>} Routed response
   */
  async route(params) {
    try {
      // Default routing: NIM (free) first, then paid providers
      const providers = params.providers || ['nim', 'cynthiaGateway', 'openai', 'muapi'];

      for (const provider of providers) {
        try {
          const adapter = this.getAdapter(provider);
          const result = await adapter.generate(params);
          return { ...result, provider };
        } catch (error) {
          // Continue to next provider
          continue;
        }
      }

      throw new Error('All providers failed');
    } catch (error) {
      throw new Error(`Routing failed: ${error.message}`);
    }
  }

  /**
   * Set configuration for a provider
   * @param {string} provider - Provider name
   * @param {object} config - Provider configuration
   */
  setProviderConfig(provider, config) {
    this.config.providers[provider] = config;
    if (this.adapters[provider]) {
      this.adapters[provider].setConfig(config);
    }
  }

  /**
   * Enable/disable mock mode
   * @param {boolean} mock - Enable mock mode
   */
  setMockMode(mock = true) {
    this.config.mock = mock;
  }

  /**
   * Get current configuration
   * @returns {object} Gateway configuration
   */
  getConfig() {
    return { ...this.config };
  }
}

export default GatewayClient;
