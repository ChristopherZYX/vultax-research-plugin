import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const endpoint = 'https://vultax.com/mcp';
const client = new Client({ name: 'vultax-distribution-validation', version: '1.0.0' });
const transport = new StreamableHTTPClientTransport(new URL(endpoint));
const checks = [];
let article;
let search;
let listed;

async function check(name, fn) {
  const started = Date.now();
  try {
    const detail = await fn();
    checks.push({ name, status: 'passed', milliseconds: Date.now() - started, detail });
    console.log(`PASS ${name}`);
  } catch (error) {
    checks.push({ name, status: 'failed', milliseconds: Date.now() - started, error: error.message });
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

async function call(name, args) {
  const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 15000 });
  assert.ok(!result.isError, JSON.stringify(result.content));
  assert.ok(result.structuredContent, 'Structured content is required');
  return result.structuredContent;
}

async function rejectsTool(name, args) {
  try {
    const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 15000 });
    assert.equal(result.isError, true, 'Invalid request must be rejected');
    return { rejected: true, rejection: 'tool-error' };
  } catch (error) {
    if (error.code === -32602 || error.code === -32601) return { rejected: true, code: error.code };
    throw error;
  }
}

try {
  await check('Official SDK initialization and tool schemas', async () => {
    await client.connect(transport);
    assert.equal(client.getServerVersion()?.name, 'vultax-research');
    listed = await client.listTools();
    assert.deepEqual(listed.tools.map(t => t.name).sort(), ['get_research_article', 'get_research_dataset', 'search_research']);
    for (const tool of listed.tools) {
      assert.equal(tool.annotations.readOnlyHint, true);
      assert.equal(tool.annotations.destructiveHint, false);
      assert.ok(tool.inputSchema && tool.outputSchema);
    }
    return { server: client.getServerVersion(), tools: listed.tools.map(t => t.name) };
  });
  await check('Search returns citable studies', async () => {
    search = await call('search_research', { query: 'copy trading', limit: 5 });
    assert.ok(search.results.length > 0);
    assert.ok(search.results.every(r => r.url.startsWith('https://vultax.com/research/') && r.publishedAt));
    return { matches: search.results.length, total: search.total, articleIds: search.results.map(r => r.id) };
  });
  await check('Read complete article with sources and limitations', async () => {
    assert.ok(search?.results.length, 'Search prerequisite failed');
    article = await call('get_research_article', { slug: search.results[0].id });
    assert.ok(article.markdown.length > 500 && article.sources.length > 0 && article.limitations.length > 0);
    assert.equal(article.id, search.results[0].id);
    assert.ok(article.publishedAt && article.modifiedAt);
    return { id: article.id, sourceCount: article.sources.length, datasetCount: article.datasets.length, publishedAt: article.publishedAt };
  });
  await check('Read all published datasets with provenance', async () => {
    const result = await call('get_research_dataset', { slug: article.id });
    assert.ok(result.datasets.length > 0);
    for (const dataset of result.datasets) {
      assert.equal(dataset.isLive, false);
      assert.ok(dataset.version && dataset.limitations && dataset.columns.length && dataset.rows.length);
      assert.ok(dataset.measurement && 'temporalCoverage' in dataset.measurement && 'population' in dataset.measurement);
      assert.ok(dataset.columns.every(column => 'unit' in column));
      assert.ok(dataset.downloads.csv.startsWith('https://vultax.com/research/'));
    }
    return { datasets: result.datasets.length, allMarkedHistorical: true };
  });
  await check('Read selected dataset and its public download', async () => {
    const id = article.datasets[0].id;
    const result = await call('get_research_dataset', { slug: article.id, dataset: id });
    assert.equal(result.datasets.length, 1);
    const dataset = result.datasets[0];
    assert.equal(dataset.id, id);
    const response = await fetch(dataset.downloads.json, { signal: AbortSignal.timeout(15000), redirect: 'error' });
    assert.equal(response.status, 200);
    const download = await response.json();
    const exported = download.datasets?.find(d => d.id === id) || (download.id === id ? download : null);
    assert.ok(exported, 'The JSON download must include the selected dataset');
    assert.deepEqual(exported.rows, dataset.rows);
    return { dataset: id, rows: dataset.rows.length, downloadMatchesTool: true };
  });
  await check('Pagination preserves separate results', async () => {
    const first = await call('search_research', { query: '', limit: 2 });
    assert.equal(first.results.length, 2);
    assert.equal(first.nextOffset, 2);
    const second = await call('search_research', { query: '', limit: 2, offset: first.nextOffset });
    assert.ok(second.results.every(r => !first.results.some(f => f.id === r.id)));
    return { total: first.total, nextOffset: second.nextOffset };
  });
  await check('Unmatched topic stays empty', async () => {
    const result = await call('search_research', { query: 'zxqv987654researchvalidationnohit', limit: 2 });
    assert.equal(result.total, 0);
    assert.deepEqual(result.results, []);
    return { total: 0 };
  });
  await check('Read an advertised Markdown resource', async () => {
    const resources = await client.listResources();
    const resource = resources.resources.find(r => r.uri === article.markdownUrl);
    assert.ok(resource);
    const result = await client.readResource({ uri: resource.uri });
    assert.equal(result.contents[0].uri, resource.uri);
    assert.ok(result.contents[0].text.includes(article.title));
    return { resources: resources.resources.length, uri: resource.uri };
  });
  await check('Reject path traversal in article slug', () => rejectsTool('get_research_article', { slug: '../../private-account' }));
  await check('Reject nonexistent article', () => rejectsTool('get_research_article', { slug: 'vultax-validation-article-that-does-not-exist' }));
  await check('Reject nonexistent dataset', () => rejectsTool('get_research_dataset', { slug: article.id, dataset: 'vultax-validation-dataset-that-does-not-exist' }));
  await check('Reject invalid pagination', () => rejectsTool('search_research', { query: '', limit: 11 }));
  await check('No trade-execution tool exists', () => rejectsTool('place_trade', { market: 'example', amount: 1 }));
  await check('All packaged client configurations use the verified endpoint', async () => {
    for (const path of ['.mcp.json', 'connections/cursor.mcp.json', 'connections/vscode.mcp.json']) {
      const config = JSON.parse(await readFile(path, 'utf8'));
      assert.equal((config.mcpServers || config.servers)['vultax-research'].url, endpoint);
    }
    return { configurations: 3 };
  });
} finally {
  await client.close().catch(() => {});
  await mkdir('evidence', { recursive: true });
  const report = { checkedAt: new Date().toISOString(), endpoint, client: '@modelcontextprotocol/sdk 1.30.0', passed: checks.filter(c => c.status === 'passed').length, failed: checks.filter(c => c.status === 'failed').length, checks };
  await writeFile('evidence/live-validation.json', JSON.stringify(report, null, 2));
  console.log(`${report.passed} passed; ${report.failed} failed`);
  if (report.failed) process.exitCode = 1;
}
