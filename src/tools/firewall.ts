import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProxmoxClient } from "../api/client.js";

export function registerFirewallTools(server: McpServer, proxmox: ProxmoxClient): void {
  server.tool(
    "list_firewall_rules",
    "List firewall rules",
    {
      scope: z
        .string()
        .optional()
        .describe("Scope: \"cluster\" for cluster-level rules, or a node name for node-level rules. Defaults to cluster."),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async (params) => {
      try {
        const path =
          params.scope === undefined || params.scope === "cluster"
            ? "/cluster/firewall/rules"
            : `/nodes/${params.scope}/firewall/rules`;
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
    "create_firewall_rule",
    "Create a firewall rule",
    {
      action: z.string().describe("Rule action: \"ACCEPT\", \"DROP\", or \"REJECT\""),
      type: z.string().describe("Rule type: \"in\", \"out\", or \"group\""),
      scope: z
        .string()
        .optional()
        .describe("Scope: \"cluster\" for cluster-level rules, or a node name for node-level rules. Defaults to cluster."),
      enable: z
        .union([z.boolean(), z.number()])
        .optional()
        .describe("Whether the rule is enabled (1/true or 0/false)"),
      source: z.string().optional().describe("Source address or network (CIDR)"),
      dest: z.string().optional().describe("Destination address or network (CIDR)"),
      proto: z.string().optional().describe("Protocol (e.g. \"tcp\", \"udp\", \"icmp\")"),
      dport: z.string().optional().describe("Destination port or port range"),
      sport: z.string().optional().describe("Source port or port range"),
      comment: z.string().optional().describe("Rule comment"),
    },
    {
      destructiveHint: false,
    },
    async (params) => {
      try {
        const data: Record<string, unknown> = {
          action: params.action,
          type: params.type,
        };
        if (params.enable !== undefined) data.enable = params.enable;
        if (params.source !== undefined) data.source = params.source;
        if (params.dest !== undefined) data.dest = params.dest;
        if (params.proto !== undefined) data.proto = params.proto;
        if (params.dport !== undefined) data.dport = params.dport;
        if (params.sport !== undefined) data.sport = params.sport;
        if (params.comment !== undefined) data.comment = params.comment;
        const path =
          params.scope === undefined || params.scope === "cluster"
            ? "/cluster/firewall/rules"
            : `/nodes/${params.scope}/firewall/rules`;
        const result = await proxmox.post(path, data);
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
    "delete_firewall_rule",
    "Delete a firewall rule",
    {
      pos: z.number().describe("Rule position to delete"),
      scope: z
        .string()
        .optional()
        .describe("Scope: \"cluster\" for cluster-level rules, or a node name for node-level rules. Defaults to cluster."),
    },
    {
      destructiveHint: true,
    },
    async (params) => {
      try {
        const path =
          params.scope === undefined || params.scope === "cluster"
            ? `/cluster/firewall/rules/${params.pos}`
            : `/nodes/${params.scope}/firewall/rules/${params.pos}`;
        const result = await proxmox.delete(path);
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
