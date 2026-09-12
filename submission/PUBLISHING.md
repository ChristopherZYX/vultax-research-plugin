# Publishing Vi Assistant by Vultax

The public endpoint is `https://vultax.com/vi-mcp`, Streamable HTTP without authentication. The prepared public listing is `openai-listing.json`. It accurately describes the five connected tools. Consult `STATUS.md` for actual publication state.

## OpenAI

Use https://platform.openai.com/plugins. In the saved publisher account, **Create plugin > With MCP** was blocked by: "You need a verified developer identity before you can create or upload a plugin."

The publisher must complete the applicable developer verification at https://platform.openai.com/settings/organization/general. Identity submission stays with the account owner. Then create a With MCP plugin, scan the endpoint, use the prepared listing and reviewer cases, and submit for review. A domain challenge, if requested, must come from that actual submission; no token is pre-generated here.

## Anthropic

The public repository contains a Claude Code plugin and self-hosted marketplace. The MCPB release contains a standalone Node/stdio server with production dependencies. These distribution methods are independent of the curated connector directory. For the latter, check the account's current organization eligibility and directory permissions at https://claude.com/docs/connectors/building/submission.

## Official MCP Registry

Keep the existing name `io.github.ChristopherZYX/vultax-research`. Update the semantic version and remote URL in `server.json`, then run the repository's manual **Publish Vultax to MCP Registry** GitHub workflow. It uses a checksum-verified official publisher and GitHub OIDC. Read back the exact new version from the public registry after the workflow succeeds.

## Gemini gallery

The root `gemini-extension.json` and `GEMINI.md` enable native GitHub installation. Add the GitHub topic `gemini-cli-extension` so Google's daily crawler can discover it. A valid manifest and topic are not confirmation that a gallery card has appeared. https://geminicli.com/docs/extensions/releasing/

## Additional directories

- Smithery: https://smithery.ai/new requires sign-in. Publish the public HTTPS endpoint using its remote-server workflow; verify the resulting listing.
- Glama: https://glama.ai/mcp/servers → Add Server requires an account. Submit the public GitHub repository. `glama.json` declares the public GitHub maintainer; automated/registry discovery is separate.
- Awesome MCP Servers: the public source and stdio package meet the repository-installation scope. Follow the contribution format and submit one relevant listing for maintainer review.
- PulseMCP: https://www.pulsemcp.com currently states new submissions are paused.
- MCP.so: https://mcp.so/submit?type=server currently offers a paid $39 submission. No budget has been authorized for a paid listing.

## Validation and packaging

Run `npm test`, `npm run test:vi` against the intended endpoint, and `node scripts/validate-stdio.mjs`. Validate the Codex plugin and MCPB manifest with their official tooling. `scripts/package-vi.py` packages public files into versioned ZIP and MCPB assets; it preserves frozen v1.0 archives.

Record actual client tests separately from compatible configuration files. Natural-language reviewer examples in `test-cases.json` are prepared cases, not claimed model evaluation results.
