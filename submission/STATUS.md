# Vi Assistant distribution status

Checked 13 September 2026 (Europe/Tallinn).

| Channel | Verified state |
| --- | --- |
| Public demo and HTTP MCP | Live at https://vultax.com/vi-mcp. Ten end-to-end checks passed, covering all five tools, market identity, missingness, scenarios and research provenance. |
| Original research MCP | The three-tool public service remains at https://vultax.com/mcp. |
| GitHub repository | Public at https://github.com/ChristopherZYX/vultax-research-plugin. [Version 1.1.0 released](https://github.com/ChristopherZYX/vultax-research-plugin/releases/tag/v1.1.0); anonymous MCPB download SHA-256 matches the original bundle. |
| Official MCP Registry | Version 1.1.0 is active as `io.github.ChristopherZYX/vultax-research`, titled Vi Assistant by Vultax, pointing to https://vultax.com/vi-mcp. [Publication run](https://github.com/ChristopherZYX/vultax-research-plugin/actions/runs/34724783854). |
| Codex | Vi 1.1 is installed and enabled in the personal marketplace. Start a new task to load updated tools. |
| Claude Code | Native plugin and self-hosted marketplace published. No curated Anthropic listing or client installation claimed. |
| Claude Desktop | Self-contained MCPB published; official manifest validation passed. The anonymously downloaded bundle was extracted and passed stdio initialization, five-tool discovery and scenario arithmetic with the official MCP SDK. |
| Gemini CLI | Native extension published and `gemini-cli-extension` repository topic added. Google gallery card appearance has not been verified; direct GitHub installation is available. |
| Cursor, VS Code/Copilot, Windsurf, OpenCode | Connection files published; not installed into those clients during this work. |
| n8n | Public feed workflow available; live n8n import not tested. |
| OpenAI public directory | Blocked by developer identity verification in the publisher portal. No listing or draft created. |
| Claude curated directory | Account eligibility and directory permissions required; not submitted. |
| Smithery | Submission route reached; sign-in required. No listing created. |
| Glama | Add Server reached; account required. Public repository includes glama.json for ownership/discovery. No listing claimed. |
| Awesome MCP Servers | [PR #14285](https://github.com/punkpeye/awesome-mcp-servers/pull/14285) submitted and open for maintainer review; one finance entry added. |
| PulseMCP | Provider currently pauses new submissions and listing changes. |
| MCP.so | Current submission route requires a $39 publishing payment. No payment made or listing submitted. |

The extension uses public provider data and pure arithmetic. It does not expose authenticated Vi executors, account state, paper positions or trade execution. No traffic or customer acquisition result has been measured yet.

Public source, download availability, registry activation and curated-directory approval are separate states.

Release MCPB SHA-256: `c68e06ff5673dce526d6a4a3d181d148171942dac43640d6b9656ba3c41c35cf`. The frozen release ZIP contains a publication-time status snapshot; this file on the default branch is the current status.
