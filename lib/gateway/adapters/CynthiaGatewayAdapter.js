/**
 * Cynthia Gateway HTTP Adapter - Direct gateway HTTP integration
 */

export class CynthiaGatewayAdapter {
  constructor(config = {}) {
    this.config = config;
    this.endpoint = config.endpoint || 'https://gateway.cynthia.studio/api/v1';
    this.apiKey = config.apiKey;
  }

  /**
   * Validate API key is configured
   * @throws {Error} If API key is missing
   */
  validateApiKey() {
    if (!this.apiKey) {
      throw new Error(
        'Cynthia Gateway API key not configured. ' +
        'Configure it in settings or environment variables.'
      );
    }
  }

  /**
   * Generate content through Cynthia Gateway
   * @param {object} params - Generation parameters
   * @returns {Promise<object>} Generation response
   */
  async generate(params) {
    this.validateApiKey();

    try {
      const response = await fetch(`${this.endpoint}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Gateway generation failed: ${error.message}`);
    }
  }

  /**
   * Get job status from Cynthia Gateway
   * @param {string} jobId - Job ID
   * @returns {Promise<object>} Job status
   */
  async getJob(jobId) {
    this.validateApiKey();

    try {
      const response = await fetch(`${this.endpoint}/job/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get job: ${error.message}`);
    }
  }

  /**
   * List available models from Cynthia Gateway
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
      return data.models || [];
    } catch (error) {
      throw new Error(`Failed to list models: ${error.message}`);
    }
  }

  /**
   * Evaluate content through Cynthia Gateway
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
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Gateway evaluation failed: ${error.message}`);
    }
  }

  /**
   * Test Cynthia Gateway credentials
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
          message: 'Cynthia Gateway API key is valid',
        };
      }

      return {
        valid: false,
        message: `Gateway returned HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        valid: false,
        message: `Connection failed: ${error.message}`,
      };
    }
  }

  /**
   * Route request through Cynthia Gateway
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
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Routing failed: ${error.message}`);
    }
  }

  /**
   * Set provider configuration
   * @param {object} config - Configuration object
   */
  setConfig(config) {
    this.config = config;
    this.endpoint = config.endpoint || this.endpoint;
    this.apiKey = config.apiKey;
  }
}

export default CynthiaGatewayAdapter;
