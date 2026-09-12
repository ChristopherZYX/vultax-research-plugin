# Vultax Research

Search and cite published crypto and prediction-market research. Retrieve complete articles, tables and chart data with source URLs, dates, units and downloadable CSV/JSON.

[Download the plugin package](https://github.com/ChristopherZYX/vultax-research-plugin/releases/latest) · [Browse public research](https://vultax.com/research) · [Connection documentation](https://vultax.com/research-access)

**Public MCP URL:** `https://vultax.com/mcp`  
**Transport:** Streamable HTTP  
**Authentication:** None. These tools expose free, public research only.

The service is operated by OmniOS OÜ, the publisher of [Vultax](https://vultax.com). Published datasets are historical observations or stated calculations, not live quotes. This connection does not provide private account access, automated alerts, personalized investment advice or trade execution.

## ChatGPT and Codex

This package contains `.codex-plugin/plugin.json`, a remote MCP connection and a research skill. Install the package through a configured local or public plugin marketplace. A local installation does not create a public directory listing.

To connect the public tools directly from the Codex CLI:

```sh
codex mcp add vultax-research --url https://vultax.com/mcp
```

Start a new Codex session after adding the connection. Use either this direct MCP connection or the packaged plugin to avoid duplicate tools.

For ChatGPT custom connections, add `https://vultax.com/mcp` as a remote MCP server with no authentication where the account supports custom connections. Public directory submission uses the [OpenAI plugin portal](https://platform.openai.com/plugins) and requires publisher verification and review.

## Claude and Claude Code

In Claude's connector settings, add a custom connector named **Vultax Research** with URL `https://vultax.com/mcp`.

For Claude Code:

```sh
claude mcp add --transport http vultax-research https://vultax.com/mcp
```

This archive also contains a native `.claude-plugin/plugin.json`; it shares the same research skill and MCP configuration. A downloaded, extracted package can be tested with:

```sh
claude --plugin-dir /absolute/path/to/vultax-research
```

## Cursor

Merge `connections/cursor.mcp.json` into your global `~/.cursor/mcp.json` or the project's `.cursor/mcp.json`. Preserve any existing server entries.

## VS Code / GitHub Copilot

Merge `connections/vscode.mcp.json` into the project's `.vscode/mcp.json`, or use **MCP: Add Server** with HTTP URL `https://vultax.com/mcp`. Preserve any existing server entries. This is a remote MCP configuration, not an installed VS Code extension.

## Workflows

- “Find research about the costs of copying Polymarket traders.”
- “What evidence supports persistence in trader performance? State the population and dates.”
- “Get the exchange feed-latency dataset and compare the reported measurements.”

Tools:

| Tool | Purpose |
| --- | --- |
| `search_research` | Search published studies; returns stable article IDs and citation URLs. |
| `get_research_article` | Read the complete published article and its metadata. |
| `get_research_dataset` | Retrieve one or all published datasets from an article. |

The [research access page](https://vultax.com/research-access) also provides Markdown articles, JSON/CSV exports and the [Atom feed](https://vultax.com/feed.xml). The included n8n workflow imports the public feed on manual request, without credentials or automatic messaging.

The public GitHub release is available independently of marketplace review. It does not imply acceptance into OpenAI's or Anthropic's curated directory.

## MCP Registry

Vultax Research is published in the [official MCP Registry](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.ChristopherZYX%2Fvultax-research/versions/latest) as `io.github.ChristopherZYX/vultax-research`. The entry points to the same public HTTPS service. Registry inclusion makes the connection metadata available to clients and aggregators; it does not automatically install the plugin in anyone's account.

Maintainers can publish a new metadata version through the manually triggered **Publish Vultax to MCP Registry** GitHub workflow. It uses GitHub OIDC and a pinned, checksum-verified official publisher. Update `server.json` before publishing a new version.

## Validation

The MCP service runs on Vultax's infrastructure; users do not need to run a local server. The Node dependency below is for maintainers verifying the public endpoint:

```sh
npm ci
npm run test:live
```

The validation script uses the official MCP SDK, calls all three tools, checks data provenance and non-live labels, verifies a downloadable dataset, and exercises invalid and out-of-scope requests. It saves a dated result in `evidence/live-validation.json`.

## Data handling and terms

Tool queries and selected article/dataset identifiers are sent to `vultax.com`. No account credentials or API keys are needed. The connection only accesses public research; avoid including private information in search queries. Vultax's [privacy policy](https://vultax.com/legal/privacy) and [terms](https://vultax.com/legal/terms) apply. Distribution packaging does not change the rights in Vultax's research, datasets or branding.
