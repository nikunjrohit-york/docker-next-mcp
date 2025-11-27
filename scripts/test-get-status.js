#!/usr/bin/env node
const { gitTools } = require('../lib/mcp/tools/git');

async function main() {
  const status = await gitTools.get_status();
  console.log('Git status:', JSON.stringify(status, null, 2));
}

main().catch((_e) => {
  process.exit(1);
});
