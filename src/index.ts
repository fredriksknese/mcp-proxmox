#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ProxmoxClient } from "./api/client.js";
import { registerNodeTools } from "./tools/nodes.js";
import { registerVmTools } from "./tools/vms.js";
import { registerContainerTools } from "./tools/containers.js";
import { registerStorageTools } from "./tools/storage.js";
import { registerNetworkTools } from "./tools/network.js";
import { registerClusterTools } from "./tools/cluster.js";
import { registerHaTools } from "./tools/ha.js";
import { registerBackupTools } from "./tools/backup.js";
import { registerFirewallTools } from "./tools/firewall.js";
import { registerAccessTools } from "./tools/access.js";
import { registerPoolTools } from "./tools/pools.js";
import { registerTaskTools } from "./tools/tasks.js";
import { registerResources } from "./resources/index.js";

const envSchema = z.object({
  PROXMOX_HOST: z.string().min(1, "PROXMOX_HOST is required"),
  PROXMOX_PORT: z.coerce.number().default(8006),
  PROXMOX_TOKEN_ID: z.string().min(1, "PROXMOX_TOKEN_ID is required"),
  PROXMOX_TOKEN_SECRET: z.string().min(1, "PROXMOX_TOKEN_SECRET is required"),
  PROXMOX_ALLOW_SELF_SIGNED_CERTS: z
    .enum(["true", "false", "1", "0"])
    .default("true")
    .transform((v) => v === "true" || v === "1"),
});

async function main() {
  const env = envSchema.safeParse(process.env);
  if (!env.success) {
    console.error("Configuration error:", env.error.format());
    process.exit(1);
  }

  const proxmox = new ProxmoxClient({
    host: env.data.PROXMOX_HOST,
    port: env.data.PROXMOX_PORT,
    tokenId: env.data.PROXMOX_TOKEN_ID,
    tokenSecret: env.data.PROXMOX_TOKEN_SECRET,
    allowSelfSignedCerts: env.data.PROXMOX_ALLOW_SELF_SIGNED_CERTS,
  });

  const server = new McpServer({
    name: "mcp-proxmox",
    version: "1.0.0",
  });

  // Register all tool domains
  registerNodeTools(server, proxmox);
  registerVmTools(server, proxmox);
  registerContainerTools(server, proxmox);
  registerStorageTools(server, proxmox);
  registerNetworkTools(server, proxmox);
  registerClusterTools(server, proxmox);
  registerHaTools(server, proxmox);
  registerBackupTools(server, proxmox);
  registerFirewallTools(server, proxmox);
  registerAccessTools(server, proxmox);
  registerPoolTools(server, proxmox);
  registerTaskTools(server, proxmox);

  // Register MCP resources
  registerResources(server, proxmox);

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Graceful shutdown
  const shutdown = async () => {
    await server.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
