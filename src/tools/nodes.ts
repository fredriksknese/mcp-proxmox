import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProxmoxClient } from "../api/client.js";

export function registerNodeTools(server: McpServer, proxmox: ProxmoxClient): void {
  server.tool(
    "list_nodes",
    "List all nodes in the Proxmox cluster",
    {},
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async () => {
      try {
        const result = await proxmox.get("/nodes");
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
    "get_node_status",
    "Get detailed status of a specific node",
    {
      node: z.string().describe("The name of the node"),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async (params) => {
      try {
        const result = await proxmox.get(`/nodes/${params.node}/status`);
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
