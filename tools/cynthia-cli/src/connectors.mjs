export const supportedConnectors = ['openclip', 'gdrive', 'onedrive'];

const ensureEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
};

export function getFalFallbackRoute() {
  const model = process.env.CYNTHIA_FAL_MODEL || 'fal-ai/veo3-fast';
  return { provider: 'fal', model, status: 'placeholder', note: 'Replace with production routing policy engine.' };
}

export function getConnectorConfig(connector) {
  switch (connector) {
    case 'openclip':
      return {
        connector,
        baseUrl: process.env.OPENCLIP_BASE_URL || 'https://api.openclip.example',
        token: ensureEnv('OPENCLIP_TOKEN')
      };
    case 'gdrive':
      return {
        connector,
        clientId: ensureEnv('GDRIVE_CLIENT_ID'),
        clientSecret: ensureEnv('GDRIVE_CLIENT_SECRET'),
        refreshToken: ensureEnv('GDRIVE_REFRESH_TOKEN')
      };
    case 'onedrive':
      return {
        connector,
        tenantId: ensureEnv('ONEDRIVE_TENANT_ID'),
        clientId: ensureEnv('ONEDRIVE_CLIENT_ID'),
        clientSecret: ensureEnv('ONEDRIVE_CLIENT_SECRET'),
        refreshToken: ensureEnv('ONEDRIVE_REFRESH_TOKEN')
      };
    default:
      throw new Error(`Unsupported connector: ${connector}`);
  }
}

export async function verifyConnector(connector) {
  const cfg = getConnectorConfig(connector);
  return { ok: true, connector, redacted: Object.keys(cfg).reduce((acc, key) => ({ ...acc, [key]: key.includes('Secret') || key.includes('token') ? '***' : cfg[key] }), {}) };
}
