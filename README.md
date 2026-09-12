# Vi Assistant by Vultax

Bring a Polymarket link to your assistant. Inspect the exact market and its resolution rules, calculate explicit price scenarios, and support your analysis with published Vultax research.

[Try the public demo](https://vultax.com/vi-mcp) · [Download v1.1.0](https://github.com/ChristopherZYX/vultax-research-plugin/releases/tag/v1.1.0) · [MCP Registry](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.ChristopherZYX%2Fvultax-research/versions/latest)

**MCP endpoint:** `https://vultax.com/vi-mcp` · Streamable HTTP · No API key

| Tool | What it does |
| --- | --- |
| `inspect_prediction_market` | Resolves an exact Polymarket event/market, returns rules, outcome prices, spread, reported volume/liquidity, source times and a bounded trade sample. Asks for selection when an event has several markets. |
| `calculate_probability_scenario` | Computes hypothetical profit/loss and break-even for explicit contract quantity, entry/scenario prices and dollar costs. |
| `search_research` | Finds published studies with stable article IDs and citation URLs. |
| `get_research_article` | Reads a complete published article and its sources. |
| `get_research_dataset` | Retrieves published tables, units, observation context and CSV/JSON downloads. |

Snapshots may be delayed. Provider metadata updates are not quote timestamps. Scenarios are arithmetic, with no forecast, backtest, market depth, slippage or execution. Published studies are historical. The public extension cannot access private accounts or create trades, alerts, bots or paper positions. It is a public Vi companion; the full authenticated Vi app has a separate access boundary.

## Install in your assistant

### Codex

Install this repository as a Codex plugin through a configured marketplace, or connect directly:

```sh
codex mcp add vultax-research --url https://vultax.com/vi-mcp
```

Start a new task after installing. The native package includes `.codex-plugin/plugin.json` and two skills. Keep the existing `vultax-research` identifier when upgrading.

### ChatGPT and Claude connectors

Where your account supports custom MCP connectors, add **Vi Assistant by Vultax** with URL `https://vultax.com/vi-mcp` and no authentication. Custom connection availability depends on the client/account. A downloadable package or registry entry does not imply approval in a curated directory. See [publication status](submission/STATUS.md).

### Claude Code marketplace

```text
/plugin marketplace add ChristopherZYX/vultax-research-plugin
/plugin install vultax-research@vultax
```

Or use a direct MCP connection:

```sh
claude mcp add --transport http vultax-research https://vultax.com/vi-mcp
```

Use either the plugin or direct connection to avoid duplicate tools. This repository contains the native plugin and its self-hosted marketplace, not an Anthropic-endorsed listing. [Official marketplace instructions](https://code.claude.com/docs/en/plugin-marketplaces).

### Claude Desktop bundle

Download `vultax-vi-1.1.0.mcpb` from the release and open it in a compatible desktop client. The bundle includes the Node server and production dependencies; Node 20+ or the client's compatible bundled runtime is required. The local transport uses stdio and opens no listening port. Research queries go to Vultax; market lookups go to Polymarket. [MCP bundle specification](https://github.com/modelcontextprotocol/mcpb).

### Gemini CLI extension

```sh
gemini extensions install https://github.com/ChristopherZYX/vultax-research-plugin --ref=v1.1.0
```

The root `gemini-extension.json` connects the same tools and includes `GEMINI.md` guidance. Gallery discovery requires the `gemini-cli-extension` topic and Google's crawler validation. [Official release instructions](https://geminicli.com/docs/extensions/releasing/).

### Cursor, VS Code, Windsurf and OpenCode

Merge the matching entry into the client's configuration, preserving existing servers:

| Client | Configuration |
| --- | --- |
| Cursor | [connections/cursor.mcp.json](connections/cursor.mcp.json) → `.cursor/mcp.json` |
| VS Code / GitHub Copilot | [connections/vscode.mcp.json](connections/vscode.mcp.json) → `.vscode/mcp.json`, or **MCP: Add Server** → HTTP |
| Windsurf / Devin Desktop | [connections/windsurf.mcp.json](connections/windsurf.mcp.json) → `~/.codeium/windsurf/mcp_config.json` |
| OpenCode | [connections/opencode.json](connections/opencode.json) → `opencode.json` |

These are MCP connections, not VS Code Marketplace extensions. Configuration references: [Windsurf/Devin](https://docs.devin.ai/desktop/cascade/mcp), [OpenCode](https://opencode.ai/docs/mcp-servers/).

### n8n and public feeds

Import [the n8n workflow](connections/n8n-vultax-research-feed.json) to retrieve Vultax's public [Atom feed](https://vultax.com/feed.xml) on manual request. It sends no messages and needs no credentials. [Research access](https://vultax.com/research-access) also provides Markdown and downloadable datasets.

## Try these workflows

- “Inspect this Polymarket link. Show its rules, available evidence, source times and the matching Vultax workspace.”
- “For 100 contracts bought at 0.50, calculate exits at 0.40 and 0.60 with $1 entry and $1 exit costs.”
- “Find research on copying Polymarket traders. Explain the measured costs and study limitations.”

The scenario example gives **−$12 and +$8**, with a break-even price of **0.52**. It is an illustration using explicit assumptions.

## Run or reuse the tools

```sh
npm ci --ignore-scripts
npm test
npm start
# Another terminal:
npm run test:vi
```

The demo starts at `http://127.0.0.1:3147`. Set `VI_TEST_URL` to test the public endpoint. For a generic stdio client use `node /absolute/path/to/src/stdio.mjs` after installing dependencies. `npm run test:live` verifies the original research-only service.

The reusable functions are [marketBrief](src/vi/market.mjs) and [probabilityScenario](src/vi/scenario.mjs). They return structured evidence/calculations without a model call. See [Vi integration notes](submission/VI-ASSISTANT.md) for reuse inside the authenticated app.

## Data handling

The hosted service receives only submitted tool arguments. Market identifiers are sent to Polymarket's public Gamma/Data APIs. Research queries and article IDs are sent to Vultax's public research MCP. Scenario arithmetic needs no external data provider. Do not include account links, credentials, private portfolios or unrelated conversation text. Fixed public-provider URLs, bounded response sizes, request timeouts, validation and request limits constrain the adapter.

Vultax infrastructure may keep ordinary HTTP/security logs. The adapter adds no user accounts, database, query analytics or payment requirements. Workspace links use fixed `utm_source=vi_assistant` attribution, with no private questions in the URL. Operated by OmniOS OÜ: [about/support](https://vultax.com/about), [privacy](https://vultax.com/legal/privacy), [terms](https://vultax.com/legal/terms).

The MIT license covers this original integration code and documentation. It does not grant rights to Vultax branding, published research or third-party market data.
