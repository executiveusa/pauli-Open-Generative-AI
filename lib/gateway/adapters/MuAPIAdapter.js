/**
 * MuAPI Provider Adapter - Integration with MuAPI service
 */

export class MuAPIAdapter {
  constructor(config = {}) {
    this.config = config;
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || 'https://api.muapi.com/v1';
  }

  /**
   * Validate API key is configured
   * @throws {Error} If API key is missing
   */
  validateApiKey() {
    if (!this.apiKey) {
      throw new Error(
        'MuAPI key not configured. ' +
        'Get a key from https://console.muapi.com'
      );
    }
  }

  /**
   * Generate content through MuAPI
   * @param {object} params - Generation parameters
   * @returns {Promise<object>} Generation response
   */
  async generate(params) {
    this.validateApiKey();

    try {
      const requestBody = {
        model: params.model || 'mu-2024',
        prompt: params.prompt,
        type: params.type || 'image',
      };

      const response = await fetch(`${this.endpoint}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        jobId: data.jobId || `muapi-${Date.now()}`,
        status: data.status || 'queued',
        provider: 'muapi',
        artifact: data.artifact || {
          type: params.type || 'image',
          url: data.url,
          format: 'url',
        },
        metadata: {
          model: params.model || 'mu-2024',
          provider: 'muapi',
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new Error(`MuAPI generation failed: ${error.message}`);
    }
  }

  /**
   * Get job status from MuAPI
   * @param {string} jobId - Job ID
   * @returns {Promise<object>} Job status
   */
  async getJob(jobId) {
    this.validateApiKey();

    try {
      const response = await fetch(`${this.endpoint}/job/${jobId}`, {
        headers: {
          'X-API-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get MuAPI job: ${error.message}`);
    }
  }

  /**
   * List available models from MuAPI
   * @returns {Promise<array>} Available models
   */
  async listModels() {
    this.validateApiKey();

    try {
      const response = await fetch(`${this.endpoint}/models`, {
        headers: {
          'X-API-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.models || [
        {
          id: 'mu-2024',
          name: 'MuAPI 2024',
          type: 'image',
          capabilities: ['image-generation', 'style-transfer'],
          costPer1kTokens: 0.0005,
        },
      ];
    } catch (error) {
      throw new Error(`Failed to list MuAPI models: ${error.message}`);
    }
  }

  /**
   * Evaluate content through MuAPI
   * @param {object} params - Evaluation parameters
   * @returns {Promise<object>} Evaluation result
   */
  async evaluate(params) {
    this.validateApiKey();

    try {
      const response = await fetch(`${this.endpoint}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`MuAPI evaluation failed: ${error.message}`);
    }
  }

  /**
   * Test MuAPI credentials
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
          'X-API-Key': this.apiKey,
        },
      });

      if (response.ok) {
        return {
          valid: true,
          message: 'MuAPI key is valid',
        };
      }

      return {
        valid: false,
        message: `MuAPI returned HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        valid: false,
        message: `Connection failed: ${error.message}`,
      };
    }
  }

  /**
   * Route request through MuAPI
   * @param {object} params - Routing parameters
   * @returns {Promise<object>} Routed response
   */
  async route(params) {
    this.validateApiKey();

    try {
      const response = await fetch(`${this.endpoint}/route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`MuAPI routing failed: ${error.message}`);
    }
  }

  /**
   * Set provider configuration
   * @param {object} config - Configuration object
   */
  setConfig(config) {
    this.config = config;
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || this.endpoint;
  }
}

export default MuAPIAdapter;
