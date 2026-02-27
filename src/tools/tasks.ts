import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProxmoxClient } from "../api/client.js";

export function registerTaskTools(server: McpServer, proxmox: ProxmoxClient): void {
  server.tool(
    "list_tasks",
    "List recent tasks",
    {
      node: z.string().describe("The node name"),
      start: z.number().optional().describe("List result offset (for pagination)"),
      limit: z.number().optional().describe("Maximum number of tasks to return"),
      vmid: z.number().optional().describe("Filter by VMID"),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async (params) => {
      try {
        const queryParams: Record<string, string> = {};
        if (params.start !== undefined) queryParams.start = String(params.start);
        if (params.limit !== undefined) queryParams.limit = String(params.limit);
        if (params.vmid !== undefined) queryParams.vmid = String(params.vmid);
        const result = await proxmox.get(
          `/nodes/${params.node}/tasks`,
          Object.keys(queryParams).length > 0 ? queryParams : undefined
        );
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
    "get_task_status",
    "Get status of a specific task",
    {
      node: z.string().describe("The node name"),
      upid: z.string().describe("The unique task UPID"),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async (params) => {
      try {
        const result = await proxmox.get(
          `/nodes/${params.node}/tasks/${params.upid}/status`
        );
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
