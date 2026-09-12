#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createViServer } from './server.mjs';
const server = createViServer();
await server.connect(new StdioServerTransport());
