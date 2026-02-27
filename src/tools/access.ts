import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProxmoxClient } from "../api/client.js";

export function registerAccessTools(server: McpServer, proxmox: ProxmoxClient): void {
  server.tool(
    "list_users",
    "List users",
    {
      enabled: z.boolean().optional().describe("Filter by enabled status"),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async (params) => {
      try {
        const queryParams: Record<string, string> | undefined =
          params.enabled !== undefined
            ? { enabled: params.enabled ? "1" : "0" }
            : undefined;
        const result = await proxmox.get("/access/users", queryParams);
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
    "list_groups",
    "List groups",
    {},
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async () => {
      try {
        const result = await proxmox.get("/access/groups");
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
    "list_roles",
    "List roles",
    {},
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async () => {
      try {
        const result = await proxmox.get("/access/roles");
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
    "get_permissions",
    "Get permissions for a path",
    {
      path: z.string().optional().describe("Path to get permissions for (e.g. \"/vms/100\")"),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async (params) => {
      try {
        const queryParams: Record<string, string> | undefined =
          params.path !== undefined
            ? { path: params.path }
            : undefined;
        const result = await proxmox.get("/access/permissions", queryParams);
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
