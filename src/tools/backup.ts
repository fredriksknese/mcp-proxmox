import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProxmoxClient } from "../api/client.js";

export function registerBackupTools(server: McpServer, proxmox: ProxmoxClient): void {
  server.tool(
    "list_backup_jobs",
    "List scheduled backup jobs",
    {},
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async () => {
      try {
        const result = await proxmox.get("/cluster/backup");
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
    "create_backup_job",
    "Create a scheduled backup job",
    {
      schedule: z.string().describe("Backup schedule in cron or systemd timer format"),
      storage: z.string().describe("Storage location for backups"),
      mode: z
        .string()
        .optional()
        .describe("Backup mode: \"snapshot\", \"suspend\", or \"stop\""),
      compress: z
        .string()
        .optional()
        .describe("Compression algorithm: \"zstd\", \"lzo\", or \"gzip\""),
      mailnotification: z
        .string()
        .optional()
        .describe("Email notification setting"),
      vmid: z
        .string()
        .optional()
        .describe("Comma-separated list of VM IDs to back up, or \"all\""),
      enabled: z.boolean().optional().describe("Whether the backup job is enabled"),
    },
    {
      destructiveHint: false,
    },
    async (params) => {
      try {
        const data: Record<string, unknown> = {
          schedule: params.schedule,
          storage: params.storage,
        };
        if (params.mode !== undefined) data.mode = params.mode;
        if (params.compress !== undefined) data.compress = params.compress;
        if (params.mailnotification !== undefined) data.mailnotification = params.mailnotification;
        if (params.vmid !== undefined) data.vmid = params.vmid;
        if (params.enabled !== undefined) data.enabled = params.enabled ? 1 : 0;
        const result = await proxmox.post("/cluster/backup", data);
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
    "run_backup",
    "Run an immediate backup (vzdump)",
    {
      node: z.string().describe("Node on which to run the backup"),
      vmid: z.string().describe("VM ID to back up"),
      storage: z.string().describe("Storage location for the backup"),
      mode: z
        .string()
        .optional()
        .describe("Backup mode: \"snapshot\", \"suspend\", or \"stop\""),
      compress: z
        .string()
        .optional()
        .describe("Compression algorithm: \"zstd\", \"lzo\", or \"gzip\""),
    },
    {
      destructiveHint: false,
    },
    async (params) => {
      try {
        const data: Record<string, unknown> = {
          vmid: params.vmid,
          storage: params.storage,
        };
        if (params.mode !== undefined) data.mode = params.mode;
        if (params.compress !== undefined) data.compress = params.compress;
        const result = await proxmox.post(`/nodes/${params.node}/vzdump`, data);
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
