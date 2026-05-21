/**
 * OpenAI Provider Adapter - Integration with OpenAI APIs
 */

export class OpenAIAdapter {
  constructor(config = {}) {
    this.config = config;
    this.apiKey = config.apiKey;
    this.endpoint = 'https://api.openai.com/v1';
  }

  /**
   * Validate API key is configured
   * @throws {Error} If API key is missing
   */
  validateApiKey() {
    if (!this.apiKey) {
      throw new Error(
        'OpenAI API key not configured. ' +
        'Get a key from https://platform.openai.com/api-keys'
      );
    }
  }

  /**
   * Generate content through OpenAI
   * @param {object} params - Generation parameters
   * @returns {Promise<object>} Generation response
   */
  async generate(params) {
    this.validateApiKey();

    try {
      const requestBody = {
        model: params.model || 'gpt-4-vision',
        prompt: params.prompt,
        n: params.n || 1,
        size: params.size || '1024x1024',
      };

      const response = await fetch(`${this.endpoint}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        jobId: `openai-${Date.now()}`,
        status: 'succeeded',
        provider: 'openai',
        artifact: {
          type: 'image',
          url: data.data[0].url,
          format: 'url',
        },
        metadata: {
          model: params.model || 'gpt-4-vision',
          provider: 'openai',
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new Error(`OpenAI generation failed: ${error.message}`);
    }
  }

  /**
   * Get job status (OpenAI doesn't support async jobs, return immediate status)
   * @param {string} jobId - Job ID
   * @returns {Promise<object>} Job status
   */
  async getJob(jobId) {
    // OpenAI doesn't have async jobs, just return succeeded status
    return {
      jobId,
      status: 'succeeded',
      provider: 'openai',
    };
  }

  /**
   * List available models from OpenAI
   * @returns {Promise<array>} Available models
   */
  async listModels() {
    this.validateApiKey();

    try {
      const response = await fetch(`${this.endpoint}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return (data.data || [])
        .filter(m => m.id.includes('gpt') || m.id.includes('dall-e'))
        .map(m => ({
          id: m.id,
          name: m.id,
          type: m.id.includes('dall-e') ? 'image' : 'text',
          capabilities: ['generation'],
          costPer1kTokens: 0.002,
        }));
    } catch (error) {
      throw new Error(`Failed to list OpenAI models: ${error.message}`);
    }
  }

  /**
   * Evaluate content (OpenAI doesn't have native evaluation, return mock)
   * @param {object} params - Evaluation parameters
   * @returns {Promise<object>} Evaluation result
   */
  async evaluate(params) {
    // OpenAI doesn't have native evaluation capabilities
    // Return a basic evaluation or throw
    throw new Error('OpenAI adapter does not support evaluation');
  }

  /**
   * Test OpenAI credentials
   * @returns {Promise<object>} Test result
   */
  async testKey() {
    if (!this.apiKey) {
      return {
        valid: false,
        message: 'API key not configured',
      };
    }

    try {
      const response = await fetch(`${this.endpoint}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (response.ok) {
        return {
          valid: true,
          message: 'OpenAI API key is valid',
        };
      }

      return {
        valid: false,
        message: `OpenAI returned HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        valid: false,
        message: `Connection failed: ${error.message}`,
      };
    }
  }

  /**
   * Route request (not supported by OpenAI adapter)
   * @param {object} params - Routing parameters
   * @returns {Promise<object>} Routed response
   */
  async route(params) {
    throw new Error('OpenAI adapter does not support routing');
  }

  /**
   * Set provider configuration
   * @param {object} config - Configuration object
   */
  setConfig(config) {
    this.config = config;
    this.apiKey = config.apiKey;
  }
}

export default OpenAIAdapter;
