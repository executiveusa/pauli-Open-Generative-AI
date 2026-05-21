/**
 * Local Provider Adapter - Local/self-hosted model integration
 */

export class LocalAdapter {
  constructor(config = {}) {
    this.config = config;
    this.endpoint = config.endpoint || 'http://localhost:8000/api/v1';
  }

  /**
   * Validate endpoint is configured
   * @throws {Error} If endpoint is missing
   */
  validateConfig() {
    if (!this.endpoint) {
      throw new Error(
        'Local provider endpoint not configured. ' +
        'Set it in settings or via CYNTHIA_LOCAL_ENDPOINT'
      );
    }
  }

  /**
   * Generate content through local provider
   * @param {object} params - Generation parameters
   * @returns {Promise<object>} Generation response
   */
  async generate(params) {
    this.validateConfig();

    try {
      const requestBody = {
        model: params.model || 'local-default',
        prompt: params.prompt,
        type: params.type || 'image',
      };

      const response = await fetch(`${this.endpoint}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        jobId: data.jobId || `local-${Date.now()}`,
        status: data.status || 'succeeded',
        provider: 'local',
        artifact: data.artifact || {
          type: params.type || 'image',
          url: data.url,
          format: 'base64',
        },
        metadata: {
          model: params.model || 'local-default',
          provider: 'local',
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new Error(`Local generation failed: ${error.message}`);
    }
  }

  /**
   * Get job status from local provider
   * @param {string} jobId - Job ID
   * @returns {Promise<object>} Job status
   */
  async getJob(jobId) {
    this.validateConfig();

    try {
      const response = await fetch(`${this.endpoint}/job/${jobId}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get local job: ${error.message}`);
    }
  }

  /**
   * List available models from local provider
   * @returns {Promise<array>} Available models
   */
  async listModels() {
    this.validateConfig();

    try {
      const response = await fetch(`${this.endpoint}/models`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.models || [
        {
          id: 'local-default',
          name: 'Local Model',
          type: 'image',
          capabilities: ['image-generation'],
          costPer1kTokens: 0,
        },
      ];
    } catch (error) {
      throw new Error(`Failed to list local models: ${error.message}`);
    }
  }

  /**
   * Evaluate content through local provider
   * @param {object} params - Evaluation parameters
   * @returns {Promise<object>} Evaluation result
   */
  async evaluate(params) {
    this.validateConfig();

    try {
      const response = await fetch(`${this.endpoint}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Local evaluation failed: ${error.message}`);
    }
  }

  /**
   * Test local provider connection
   * @returns {Promise<object>} Test result
   */
  async testKey() {
    if (!this.endpoint) {
      return {
        valid: false,
        message: 'Endpoint not configured',
      };
    }

    try {
      const response = await fetch(`${this.endpoint}/health`, {
        method: 'GET',
      });

      if (response.ok) {
        return {
          valid: true,
          message: 'Local provider is accessible',
        };
      }

      return {
        valid: false,
        message: `Local provider returned HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        valid: false,
        message: `Connection failed: ${error.message}`,
      };
    }
  }

  /**
   * Route request through local provider
   * @param {object} params - Routing parameters
   * @returns {Promise<object>} Routed response
   */
  async route(params) {
    this.validateConfig();

    try {
      const response = await fetch(`${this.endpoint}/route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Local routing failed: ${error.message}`);
    }
  }

  /**
   * Set provider configuration
   * @param {object} config - Configuration object
   */
  setConfig(config) {
    this.config = config;
    this.endpoint = config.endpoint || this.endpoint;
  }
}

export default LocalAdapter;
