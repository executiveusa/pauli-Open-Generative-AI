const connectorAliases = {
  openclip: 'opusclip'
};

export const supportedConnectors = ['opusclip', 'gdrive', 'onedrive'];

const ensureEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
};

function normalizeConnectorName(connector) {
  return connectorAliases[connector] || connector;
}

export function getFalFallbackRoute() {
  const model = process.env.SYNTHIA_FAL_MODEL || process.env.CYNTHIA_FAL_MODEL || 'fal-ai/veo3-fast';
  return { provider: 'fal', model, status: 'placeholder', note: 'Replace with production routing policy engine.' };
}

export function getConnectorConfig(connector) {
  const normalizedConnector = normalizeConnectorName(connector);

  switch (normalizedConnector) {
    case 'opusclip':
      return {
        connector: normalizedConnector,
        baseUrl: process.env.OPUSCLIP_BASE_URL || 'https://api.opus.pro',
        token: ensureEnv('OPUSCLIP_TOKEN')
      };
    case 'gdrive':
      return {
        connector: normalizedConnector,
        clientId: ensureEnv('GDRIVE_CLIENT_ID'),
        clientSecret: ensureEnv('GDRIVE_CLIENT_SECRET'),
        refreshToken: ensureEnv('GDRIVE_REFRESH_TOKEN')
      };
    case 'onedrive':
      return {
        connector: normalizedConnector,
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
  const redacted = Object.keys(cfg).reduce((acc, key) => ({
    ...acc,
    [key]: key.toLowerCase().includes('secret') || key.toLowerCase().includes('token') ? '***' : cfg[key]
  }), {});

  return { ok: true, connector: cfg.connector, redacted };
}
