// Portable public-market evidence adapter. It has no account or model dependency.
const SLUG = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,239}$/;
const CONDITION = /^0x[a-fA-F0-9]{64}$/;
const ORIGIN = 'https://gamma-api.polymarket.com';
export class EvidenceError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
export function numeric(value) {
  if (!['number', 'string'].includes(typeof value) || String(value).trim() === '') return null;
  const n = Number(value); return Number.isFinite(n) ? n : null;
}
const nonnegative = value => { const n = numeric(value); return n !== null && n >= 0 ? n : null; };
const probability = value => { const n = numeric(value); return n !== null && n >= 0 && n <= 1 ? n : null; };
const text = (value, limit = 500) => typeof value === 'string' ? value.slice(0, limit) : '';
const list = value => { if (Array.isArray(value)) return value; try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; } };
export function iso(value) { if (typeof value !== 'string' || !value.trim()) return null; const n = Date.parse(value); return Number.isFinite(n) ? new Date(n).toISOString() : null; }
export function timeStatus(value, now = Date.now()) {
  const time = iso(value); if (!time || Date.parse(time) > now + 60000) return 'unverified';
  const age = now - Date.parse(time); return age > 3600000 ? 'stale' : age > 900000 ? 'delayed' : 'recent_snapshot';
}
export function parseMarketInput(input, selectedSlug) {
  if (typeof input !== 'string' || input.length > 2048) throw new EvidenceError('invalid_market', 'Provide a Polymarket event or market URL, or an exact market slug.');
  if (selectedSlug !== undefined && !SLUG.test(selectedSlug)) throw new EvidenceError('invalid_market', 'Invalid selected market slug.');
  const trimmed = input.trim();
  if (SLUG.test(trimmed)) return { kind: 'market', slug: trimmed, selectedSlug };
  try {
    const url = new URL(trimmed.startsWith('polymarket.com/') ? `https://${trimmed}` : trimmed);
    if (url.protocol !== 'https:' || !['polymarket.com', 'www.polymarket.com'].includes(url.hostname) || url.port || url.username || url.password) throw Error();
    const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
    if (/^(en|es|fr|de|pt|zh|ja|ko|ru|tr|it)$/.test(parts[0])) parts.shift();
    if (!['event', 'market'].includes(parts[0]) || !SLUG.test(parts[1] || '') || parts.length > (parts[0] === 'event' ? 3 : 2)) throw Error();
    if (parts[2] && !SLUG.test(parts[2])) throw Error();
    if (parts[2] && selectedSlug && parts[2] !== selectedSlug) throw Error();
    return { kind: parts[0], slug: parts[1], selectedSlug: selectedSlug || parts[2] };
  } catch { throw new EvidenceError('invalid_market', 'Only exact Polymarket market/event links are accepted.'); }
}
export async function boundedJson(url, fetcher = fetch, maxBytes = 3_000_000) {
  const response = await fetcher(url, { method: 'GET', redirect: 'error', credentials: 'omit', signal: AbortSignal.timeout(12000), headers: { Accept: 'application/json' } });
  if (!response.ok) throw new EvidenceError(response.status === 404 ? 'not_found' : 'provider_unavailable', `Public data provider returned HTTP ${response.status}.`);
  if (Number(response.headers.get('content-length')) > maxBytes) throw new EvidenceError('response_too_large', 'Provider response exceeded the evidence limit.');
  const reader = response.body?.getReader(); if (!reader) throw new EvidenceError('invalid_provider', 'Provider returned no body.');
  const chunks = []; let size = 0;
  try {
    for (;;) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > maxBytes) { await reader.cancel(); throw new EvidenceError('response_too_large', 'Provider response exceeded the evidence limit.'); } chunks.push(value); }
  } finally { reader.releaseLock(); }
  const data = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(data)); } catch { throw new EvidenceError('invalid_provider', 'Provider returned malformed JSON.'); }
}
function normalize(raw) {
  if (!raw || !SLUG.test(raw.slug || '') || !text(raw.question)) throw new EvidenceError('invalid_provider', 'The provider omitted a valid market identity.');
  const outcomes = list(raw.outcomes), prices = list(raw.outcomePrices), bid = probability(raw.bestBid), ask = probability(raw.bestAsk);
  const change = numeric(raw.oneDayPriceChange);
  return {
    id: text(String(raw.id ?? ''), 128), slug: raw.slug, conditionId: CONDITION.test(raw.conditionId || '') ? raw.conditionId.toLowerCase() : null,
    question: text(raw.question, 1000), rules: text(raw.description, 12000), sourceUpdatedAt: iso(raw.updatedAt), closesAt: iso(raw.endDate),
    closed: raw.closed === true, acceptingOrders: typeof raw.acceptingOrders === 'boolean' ? raw.acceptingOrders : null,
    outcomes: outcomes.slice(0, 20).map((label, i) => ({ label: text(label, 120), impliedProbability: probability(prices[i]) })),
    firstOutcomeQuote: { bid, ask, spreadProbabilityPoints: bid !== null && ask !== null && ask >= bid ? (ask - bid) * 100 : null, change24hProbabilityPoints: change !== null && Math.abs(change) <= 1 ? change * 100 : null },
    volume24hUsd: nonnegative(raw.volume24hr), totalVolumeUsd: nonnegative(raw.volumeNum ?? raw.volume), liquidityUsd: nonnegative(raw.liquidityNum ?? raw.liquidity)
  };
}
export function workspaceUrl(slug) {
  if (!SLUG.test(slug || '')) throw new EvidenceError('invalid_market', 'Invalid workspace market identity.');
  const url = new URL(`https://app.vultax.com/predictions/market/${slug}`);
  url.searchParams.set('utm_source', 'vi_assistant'); url.searchParams.set('utm_medium', 'mcp'); return url.href;
}
export async function marketBrief({ market, marketSlug, includeTrades = true }, { fetcher = fetch, now = () => Date.now() } = {}) {
  const context = parseMarketInput(market, marketSlug);
  const source = `${ORIGIN}/${context.kind === 'event' ? 'events' : 'markets'}/slug/${encodeURIComponent(context.slug)}`;
  const raw = await boundedJson(source, fetcher);
  if (!raw || Array.isArray(raw) || raw.slug !== context.slug) throw new EvidenceError('identity_mismatch', 'Provider response did not match the requested identity.');
  const rows = context.kind === 'event' ? raw.markets : [raw];
  if (!Array.isArray(rows) || rows.length === 0) throw new EvidenceError('not_found', 'No markets were returned for this event.');
  if (rows.length > 150) throw new EvidenceError('event_too_large', 'Open an exact market link from this event.');
  const normalized = rows.map(normalize);
  if (!context.selectedSlug && normalized.length > 1) return {
    status: 'needs_selection', event: { title: text(raw.title), slug: raw.slug }, fetchedAt: new Date(now()).toISOString(),
    candidates: normalized.map(row => ({ slug: row.slug, question: row.question, closed: row.closed })),
    instruction: 'Ask the user to select the exact outcome market, then call with marketSlug. No outcome was selected automatically.', sources: [source]
  };
  const chosen = context.selectedSlug ? normalized.find(row => row.slug === context.selectedSlug) : normalized[0];
  if (!chosen) throw new EvidenceError('not_found', 'The requested market is not present in this event.');
  const warnings = ['A market price is an implied probability, not a verified forecast.', 'Provider metadata update time is not a guaranteed quote timestamp.', 'Liquidity totals do not guarantee executable depth.'];
  const sources = [{ label: 'Polymarket market metadata', url: source, observedAt: chosen.sourceUpdatedAt }];
  let recentTrades = null;
  if (includeTrades && chosen.conditionId) {
    const tradeSource = `https://data-api.polymarket.com/trades?${new URLSearchParams({ market: chosen.conditionId, limit: '8', takerOnly: 'true' })}`;
    try {
      const trades = await boundedJson(tradeSource, fetcher, 500000);
      if (!Array.isArray(trades) || trades.some(row => row.conditionId?.toLowerCase() !== chosen.conditionId)) throw new EvidenceError('identity_mismatch', 'Trade identity did not match the selected market.');
      recentTrades = trades.slice(0, 8).map(row => {
        const size = nonnegative(row.size), price = probability(row.price), seconds = nonnegative(row.timestamp);
        return { side: ['BUY', 'SELL'].includes(row.side) ? row.side : null, outcome: text(row.outcome, 120), contracts: size, priceUsd: price, notionalUsd: size !== null && price !== null ? size * price : null, observedAt: seconds !== null && seconds < 8640000000000 ? new Date(seconds * 1000).toISOString() : null };
      });
      sources.push({ label: 'Polymarket recent taker trades', url: tradeSource, observedAt: recentTrades[0]?.observedAt ?? null });
      warnings.push('Recent trades are a bounded sample of taker activity; they do not establish net whale flow, intent, or market-wide buying pressure.');
    } catch { warnings.push('Recent trades are unavailable or did not pass identity checks.'); }
  }
  const freshness = timeStatus(chosen.sourceUpdatedAt, now());
  if (freshness !== 'recent_snapshot') warnings.push(`Market metadata freshness: ${freshness}.`);
  return {
    status: recentTrades === null && includeTrades ? 'partial' : 'available', evidenceType: 'public_market_snapshot', isLive: false,
    fetchedAt: new Date(now()).toISOString(), freshness, market: chosen, recentTrades, sources, warnings,
    inspectNext: ['Read the exact resolution rules and deadline.', 'Inspect both outcome prices and the spread.', 'Compare activity against the observation window before explaining a move.'],
    links: { polymarket: context.kind === 'event' ? `https://polymarket.com/event/${context.slug}/${chosen.slug}` : `https://polymarket.com/market/${chosen.slug}`, vultax: workspaceUrl(chosen.slug) }
  };
}
