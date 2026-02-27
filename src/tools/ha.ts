import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProxmoxClient } from "../api/client.js";

export function registerHaTools(server: McpServer, proxmox: ProxmoxClient): void {
  server.tool(
    "list_ha_resources",
    "List HA managed resources",
    {},
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async () => {
      try {
        const result = await proxmox.get("/cluster/ha/resources");
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
    "create_ha_resource",
    "Add a resource to HA management",
    {
      sid: z.string().describe("Resource ID, e.g. \"vm:100\""),
      group: z.string().optional().describe("HA group to assign the resource to"),
      max_restart: z.number().optional().describe("Maximum number of restart attempts"),
      max_relocate: z.number().optional().describe("Maximum number of relocate attempts"),
      state: z
        .string()
        .optional()
        .describe("Requested resource state: \"started\", \"stopped\", \"enabled\", \"disabled\""),
    },
    {
      destructiveHint: false,
    },
    async (params) => {
      try {
        const data: Record<string, unknown> = { sid: params.sid };
        if (params.group !== undefined) data.group = params.group;
        if (params.max_restart !== undefined) data.max_restart = params.max_restart;
        if (params.max_relocate !== undefined) data.max_relocate = params.max_relocate;
        if (params.state !== undefined) data.state = params.state;
        const result = await proxmox.post("/cluster/ha/resources", data);
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
    "delete_ha_resource",
    "Remove resource from HA",
    {
      sid: z.string().describe("Resource ID to remove, e.g. \"vm:100\""),
    },
    {
      destructiveHint: true,
    },
    async (params) => {
      try {
        const result = await proxmox.delete(`/cluster/ha/resources/${params.sid}`);
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
    "list_ha_groups",
    "List HA groups",
    {},
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async () => {
      try {
        const result = await proxmox.get("/cluster/ha/groups");
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
