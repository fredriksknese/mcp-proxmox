import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProxmoxClient } from "../api/client.js";

export function registerStorageTools(server: McpServer, proxmox: ProxmoxClient): void {
  server.tool(
    "list_storage",
    "List storage",
    {
      node: z.string().optional().describe("Node name to list storage for. If omitted, lists cluster-wide storage."),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async (params) => {
      try {
        const path = params.node
          ? `/nodes/${params.node}/storage`
          : "/storage";
        const result = await proxmox.get(path);
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
    "get_storage_content",
    "List content of a storage",
    {
      node: z.string().describe("The name of the node"),
      storage: z.string().describe("The name of the storage"),
      content: z
        .string()
        .optional()
        .describe("Content type filter: iso, vztmpl, backup, images, etc."),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async (params) => {
      try {
        const queryParams: Record<string, string> | undefined = params.content
          ? { content: params.content }
          : undefined;
        const result = await proxmox.get(
          `/nodes/${params.node}/storage/${params.storage}/content`,
          queryParams
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
    "download_url_to_storage",
    "Download from URL to storage",
    {
      node: z.string().describe("The name of the node"),
      storage: z.string().describe("The name of the storage"),
      url: z.string().describe("The URL to download from"),
      content: z
        .string()
        .describe("Content type: iso or vztmpl"),
      filename: z.string().describe("The filename to save as"),
    },
    {
      destructiveHint: false,
    },
    async (params) => {
      try {
        const result = await proxmox.post(
          `/nodes/${params.node}/storage/${params.storage}/download-url`,
          {
            url: params.url,
            content: params.content,
            filename: params.filename,
          }
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
