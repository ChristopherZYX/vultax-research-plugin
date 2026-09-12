import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { boundedJson } from '../src/vi/market.mjs';
const endpoint = process.env.VI_TEST_URL || 'http://127.0.0.1:3147/mcp';
const client = new Client({ name: 'vi-release-verification', version: '1.1.0' });
const checks = [], details = {};
async function check(name, fn) { await fn(); checks.push({ name, passed: true }); console.log(`PASS ${name}`); }
function unpack(result) { assert.notEqual(result.isError, true, JSON.stringify(result)); return result.structuredContent ?? JSON.parse(result.content.find(x=>x.type==='text').text); }
try {
  await check('MCP initialization', async()=>{await client.connect(new StreamableHTTPClientTransport(new URL(endpoint)));});
  await check('Five read-only tools advertised', async()=>{const {tools}=await client.listTools();assert.equal(tools.length,5);assert.ok(tools.every(t=>t.annotations.readOnlyHint && !t.annotations.destructiveHint));details.tools=tools.map(t=>t.name);});
  await check('Scenario arithmetic through MCP', async()=>{const r=unpack(await client.callTool({name:'calculate_probability_scenario',arguments:{contracts:100,entryPrice:0.5,scenarioPrices:[0.4,0.6],entryCostUsd:1,exitCostUsd:1}}));assert.deepEqual(r.scenarios.map(x=>x.profitLossUsd),[-12,8]);assert.equal(r.breakEvenPrice,0.52);});
  await check('Invalid scenario rejected', async()=>{const r=await client.callTool({name:'calculate_probability_scenario',arguments:{contracts:100,entryPrice:5,scenarioPrices:[0.4]}});assert.equal(r.isError,true);});
  await check('Arbitrary URL rejected by market tool',async()=>{const r=await client.callTool({name:'inspect_prediction_market',arguments:{market:'https://127.0.0.1/private'}});assert.equal(r.isError,true);});
  const events = await boundedJson('https://gamma-api.polymarket.com/events?active=true&closed=false&limit=1&order=volume24hr&ascending=false');
  const event=events[0];assert.ok(event?.slug && event.markets?.length);
  if(event.markets.length>1) await check('Event ambiguity preserved through MCP',async()=>{const r=unpack(await client.callTool({name:'inspect_prediction_market',arguments:{market:`https://polymarket.com/event/${event.slug}`}}));assert.equal(r.status,'needs_selection');});
  const selected=event.markets.find(x=>x.closed!==true) || event.markets[0];details.market=selected.slug;
  await check('Live public market evidence and exact identity',async()=>{const r=unpack(await client.callTool({name:'inspect_prediction_market',arguments:{market:`https://polymarket.com/event/${event.slug}`,marketSlug:selected.slug}}));assert.equal(r.market.slug,selected.slug);assert.equal(r.isLive,false);assert.ok(r.sources[0].url.startsWith('https://gamma-api.polymarket.com'));assert.ok(r.links.vultax.includes(selected.slug));details.marketStatus=r.status;details.marketFreshness=r.freshness;await mkdir('evidence',{recursive:true});await writeFile('evidence/vi-market-example.json',JSON.stringify(r,null,2));});
  await check('Research search bridge',async()=>{const r=await client.callTool({name:'search_research',arguments:{query:'copy trading',limit:2}});assert.notEqual(r.isError,true);details.research=r.structuredContent ?? JSON.parse(r.content[0].text);});
  await check('Research article and dataset bridge',async()=>{const slug=details.research.results[0].id;const article=unpack(await client.callTool({name:'get_research_article',arguments:{slug}}));assert.equal(article.id,slug);assert.ok(article.markdown.length>500);const dataset=article.datasets[0].id;const data=unpack(await client.callTool({name:'get_research_dataset',arguments:{slug,dataset}}));assert.equal(data.datasets.length,1);assert.equal(data.datasets[0].id,dataset);assert.equal(data.datasets[0].isLive,false);assert.ok(data.datasets[0].rows.length>0);});
  await check('Workflow resource and prompt',async()=>{assert.ok((await client.listResources()).resources.some(x=>x.uri==='vi://guide'));assert.ok((await client.getPrompt({name:'investigate-market',arguments:{market:selected.slug}})).messages[0].content.text.includes(selected.slug));});
} finally { await client.close(); }
await mkdir('evidence',{recursive:true});
await writeFile('evidence/vi-live-validation.json',JSON.stringify({checkedAt:new Date().toISOString(),endpoint,passed:checks.length,checks,details},null,2));
console.log(JSON.stringify({passed:checks.length,endpoint,market:details.market}));
