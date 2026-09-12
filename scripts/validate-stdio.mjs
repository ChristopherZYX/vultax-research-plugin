import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
const entry = process.argv[2] || 'src/stdio.mjs';
const client = new Client({ name: 'vi-stdio-validation', version: '1.1.0' });
try {
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [entry], stderr: 'pipe' }));
  assert.equal(client.getServerVersion().version,'1.1.0');
  assert.equal((await client.listTools()).tools.length,5);
  const r=await client.callTool({name:'calculate_probability_scenario',arguments:{contracts:100,entryPrice:0.5,scenarioPrices:[0.4,0.6],entryCostUsd:1,exitCostUsd:1}});
  assert.notEqual(r.isError,true);
  assert.deepEqual(r.structuredContent.scenarios.map(x=>x.profitLossUsd),[-12,8]);
  console.log('PASS stdio initialization, five tools and scenario arithmetic');
} finally { await client.close(); }
