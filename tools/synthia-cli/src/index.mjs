#!/usr/bin/env node
import { getFalFallbackRoute, supportedConnectors, verifyConnector } from './connectors.mjs';

async function main() {
  const [command, arg] = process.argv.slice(2);
  if (command === 'doctor') {
    console.log(JSON.stringify({ app: 'Synthia Studio LatAm CLI', connectors: supportedConnectors, falFallback: getFalFallbackRoute() }, null, 2));
    return;
  }

  if (command === 'check-connector') {
    if (!arg) throw new Error('Usage: check-connector <opusclip|gdrive|onedrive>');
    const result = await verifyConnector(arg);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('Usage:\n  synthia doctor\n  synthia check-connector <opusclip|gdrive|onedrive>');
}

main().catch((error) => {
  console.error(`[synthia-cli] ${error.message}`);
  process.exit(1);
});
