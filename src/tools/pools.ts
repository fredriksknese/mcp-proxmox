import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProxmoxClient } from "../api/client.js";

export function registerPoolTools(server: McpServer, proxmox: ProxmoxClient): void {
  server.tool(
    "list_pools",
    "List resource pools",
    {},
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async () => {
      try {
        const result = await proxmox.get("/pools");
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
    "create_pool",
    "Create a resource pool",
    {
      poolid: z.string().describe("The pool ID"),
      comment: z.string().optional().describe("Pool comment/description"),
    },
    {
      destructiveHint: false,
    },
    async (params) => {
      try {
        const body: Record<string, unknown> = { poolid: params.poolid };
        if (params.comment !== undefined) body.comment = params.comment;
        const result = await proxmox.post("/pools", body);
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
    "get_pool",
    "Get pool details",
    {
      poolid: z.string().describe("The pool ID"),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async (params) => {
      try {
        const result = await proxmox.get(`/pools/${params.poolid}`);
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
    "update_pool",
    "Update pool (add/remove members)",
    {
      poolid: z.string().describe("The pool ID"),
      comment: z.string().optional().describe("Pool comment/description"),
      vms: z.string().optional().describe("Comma-separated list of VMIDs to add/remove"),
      storage: z.string().optional().describe("Comma-separated list of storage IDs to add/remove"),
      delete: z.boolean().optional().describe("If true, remove the specified vms/storage instead of adding"),
    },
    {
      destructiveHint: false,
      idempotentHint: true,
    },
    async (params) => {
      try {
        const { poolid, ...body } = params;
        const result = await proxmox.put(`/pools/${poolid}`, body);
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
    "delete_pool",
    "Delete a resource pool",
    {
      poolid: z.string().describe("The pool ID"),
    },
    {
      destructiveHint: true,
    },
    async (params) => {
      try {
        const result = await proxmox.delete(`/pools/${params.poolid}`);
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
