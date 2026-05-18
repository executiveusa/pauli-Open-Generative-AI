/**
 * Shared middleware helpers: CORS, body parsing, response helpers.
 */

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

/**
 * Send a JSON response.
 */
export function json(res, code, payload) {
  res.writeHead(code, { 'Content-Type': 'application/json', ...CORS_HEADERS });
  res.end(JSON.stringify(payload));
}

/**
 * Send a structured error response.
 */
export function apiError(res, code, errorCode, message, details = null) {
  const payload = { error: { code: errorCode, message } };
  if (details) payload.error.details = details;
  json(res, code, payload);
}

/**
 * Read and parse JSON body from request.
 */
export function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Read raw body as Buffer (for file uploads).
 */
export function readBuffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
