import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProxmoxClient } from "../api/client.js";

export function registerClusterTools(server: McpServer, proxmox: ProxmoxClient): void {
  server.tool(
    "get_cluster_status",
    "Get cluster status",
    {},
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async () => {
      try {
        const result = await proxmox.get("/cluster/status");
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get_cluster_resources",
    "Get all cluster resources",
    {
      type: z
        .string()
        .optional()
        .describe("Resource type filter: vm, storage, node, sdn"),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async (params) => {
      try {
        const queryParams: Record<string, string> | undefined = params.type
          ? { type: params.type }
          : undefined;
        const result = await proxmox.get("/cluster/resources", queryParams);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
