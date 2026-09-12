# Reusing the public Vi tools in Vultax

Version 1.1 adds two concrete public workflows to the original three research tools. The same implementation runs through HTTP, stdio and the public demo.

## File map and evidence contract

| File | Responsibility |
| --- | --- |
| `src/vi/market.mjs` | Exact identity resolution, fixed public-provider fetches, normalization, missingness and provenance. Exports `marketBrief`, URL parser and small helpers. |
| `src/vi/scenario.mjs` | Pure scenario arithmetic with explicit USD costs, validation and break-even limits. Exports `probabilityScenario`. |
| `src/server.mjs` | MCP schemas, descriptions, research bridge, prompt and guide. |
| `src/node-server.mjs` | HTTP transport, demo/API routing, bounded requests and rate limits. |
| `src/stdio.mjs` | Desktop and local-client transport. |
| `public/index.html` | Public evidence card and scenario table. |

Market results distinguish `available`, `partial` and `needs_selection`. Source times, metadata freshness, exact market identity, missing values, units, source links and limitations travel with the values. A recent metadata timestamp never proves a live quote. A short trade sample cannot establish the cause of a move or characterize the complete market flow.

## Transfer into the authenticated Vi app

Import the two pure modules into an app adapter or keep them as a versioned package. Translate the structured result into Vi's existing evidence envelope. Render `needs_selection` as a market choice. Preserve partial and unavailable domains in the UI, and cite exact sources. Add a reviewed adapter test against the application's own schema before integrating.

The existing Vi chat access boundary includes session, plan and allowance checks. Keep that boundary for restricted tools. This public companion fetches public data independently and does not expose private tool executors, account state or paid endpoints.

## Next useful product experiments

1. A shareable market brief: preserve a dated evidence snapshot and provide a compact image/card with a Vultax market link. Requires explicit retention and sharing behavior; current service stores no briefs.
2. A scenario handoff: transfer explicit user assumptions to the existing paper workspace after account connection and approval. Current calculations create no paper positions.
3. Crypto comparison: use existing authenticated Vi sources, with comparable periods and separate freshness for price, liquidity, large trades and news. Not included in this public release.
4. Structured research follow-up: combine a market brief with relevant historical Vultax studies while keeping current observations and historical cohorts distinct.

Success should be measured through useful investigations, repeat use and attributed Vultax workspace visits. Registry or gallery availability alone is not acquisition evidence.
