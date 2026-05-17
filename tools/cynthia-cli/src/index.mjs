#!/usr/bin/env node
import { getFalFallbackRoute, supportedConnectors, verifyConnector } from './connectors.mjs';

async function main() {
  const [command, arg] = process.argv.slice(2);
  if (command === 'doctor') {
    console.log(JSON.stringify({ app: 'Cynthia Studio LatAm CLI', connectors: supportedConnectors, falFallback: getFalFallbackRoute() }, null, 2));
    return;
  }

  if (command === 'check-connector') {
    if (!arg) throw new Error('Usage: check-connector <openclip|gdrive|onedrive>');
    const result = await verifyConnector(arg);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('Usage:\n  cynthia doctor\n  cynthia check-connector <openclip|gdrive|onedrive>');
}

main().catch((error) => {
  console.error(`[cynthia-cli] ${error.message}`);
  process.exit(1);
});
