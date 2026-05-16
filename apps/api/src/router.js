/**
 * Minimal path router with parameter extraction.
 * Pattern: /v1/projects/:id → matches and extracts { id }
 */
export class Router {
  constructor() {
    this._routes = [];
  }

  _add(method, pattern, handler) {
    const keys = [];
    const re = new RegExp(
      '^' +
      pattern
        .replace(/:([^/]+)/g, (_, key) => { keys.push(key); return '([^/]+)'; })
        .replace(/\//g, '\\/') +
      '(?:\\?.*)?$'
    );
    this._routes.push({ method, re, keys, handler });
  }

  get(pattern, handler) { this._add('GET', pattern, handler); return this; }
  post(pattern, handler) { this._add('POST', pattern, handler); return this; }
  patch(pattern, handler) { this._add('PATCH', pattern, handler); return this; }
  delete(pattern, handler) { this._add('DELETE', pattern, handler); return this; }

  match(method, pathname) {
    for (const route of this._routes) {
      if (route.method !== method) continue;
      const m = pathname.match(route.re);
      if (m) {
        const params = {};
        route.keys.forEach((k, i) => { params[k] = m[i + 1]; });
        return { handler: route.handler, params };
      }
    }
    return null;
  }
}
