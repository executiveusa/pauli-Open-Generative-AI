/**
 * HTTP client for ACE-Step Gradio API
 * Handles all communication with the Gradio server
 */

/**
 * Make HTTP request to ACE-Step Gradio API
 * @param {string} apiUrl Base URL of ACE-Step Gradio API
 * @param {string} endpoint Endpoint path (e.g., '/call/generate')
 * @param {object} payload Request payload
 * @param {number} timeoutMs Timeout in milliseconds
 * @returns {Promise<object>} Response from API
 */
export async function makeRequest(apiUrl, endpoint, payload = {}, timeoutMs = 30000) {
  const url = `${apiUrl}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 200)}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Get Gradio API info (list endpoints)
 * @param {string} apiUrl Base URL of ACE-Step Gradio API
 * @returns {Promise<object>} Gradio API info
 */
export async function getApiInfo(apiUrl) {
  return makeRequest(apiUrl, '/info', {}, 5000);
}

/**
 * Submit a song generation job to Gradio
 * @param {string} apiUrl Base URL of ACE-Step Gradio API
 * @param {object} params Generation parameters
 * @returns {Promise<object>} Job info (includes job hash)
 */
export async function submitSongGeneration(apiUrl, params) {
  return makeRequest(apiUrl, '/call/generate_song', params, 10000);
}

/**
 * Poll job status
 * @param {string} apiUrl Base URL of ACE-Step Gradio API
 * @param {string} jobHash Job hash from submission
 * @returns {Promise<object>} Job status
 */
export async function pollJobStatus(apiUrl, jobHash) {
  return makeRequest(apiUrl, `/queue/join?__theme=light`, { data: [jobHash] }, 10000);
}

/**
 * Download file from temporary Gradio storage
 * @param {string} fileUrl Full URL to file
 * @returns {Promise<Buffer>} File contents
 */
export async function downloadFile(fileUrl) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 min for large files

  try {
    const response = await fetch(fileUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Failed to download: HTTP ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } finally {
    clearTimeout(timeoutId);
  }
}
