import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProxmoxClient } from "../api/client.js";

export function registerNetworkTools(server: McpServer, proxmox: ProxmoxClient): void {
  server.tool(
    "list_networks",
    "List network interfaces",
    {
      node: z.string().describe("The name of the node"),
      type: z.string().optional().describe("Filter by interface type"),
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
        const result = await proxmox.get(
          `/nodes/${params.node}/network`,
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
    "create_network",
    "Create network interface",
    {
      node: z.string().describe("The name of the node"),
      iface: z.string().describe("The network interface name"),
      type: z
        .string()
        .describe("Interface type: bridge, bond, vlan, OVSBridge, etc."),
      address: z.string().optional().describe("IP address"),
      netmask: z.string().optional().describe("Network mask"),
      gateway: z.string().optional().describe("Default gateway"),
      bridge_ports: z.string().optional().describe("Bridge ports"),
      autostart: z.boolean().optional().describe("Start interface on boot"),
    },
    {
      destructiveHint: false,
    },
    async (params) => {
      try {
        const data: Record<string, unknown> = {
          iface: params.iface,
          type: params.type,
        };
        if (params.address !== undefined) data.address = params.address;
        if (params.netmask !== undefined) data.netmask = params.netmask;
        if (params.gateway !== undefined) data.gateway = params.gateway;
        if (params.bridge_ports !== undefined) data.bridge_ports = params.bridge_ports;
        if (params.autostart !== undefined) data.autostart = params.autostart ? 1 : 0;

        const result = await proxmox.post(
          `/nodes/${params.node}/network`,
          data
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
    "update_network",
    "Update network interface",
    {
      node: z.string().describe("The name of the node"),
      iface: z.string().describe("The network interface name"),
      type: z.string().describe("Interface type: bridge, bond, vlan, OVSBridge, etc."),
      address: z.string().optional().describe("IP address"),
      netmask: z.string().optional().describe("Network mask"),
      gateway: z.string().optional().describe("Default gateway"),
      bridge_ports: z.string().optional().describe("Bridge ports"),
      autostart: z.boolean().optional().describe("Start interface on boot"),
    },
    {
      destructiveHint: false,
      idempotentHint: true,
    },
    async (params) => {
      try {
        const data: Record<string, unknown> = {
          type: params.type,
        };
        if (params.address !== undefined) data.address = params.address;
        if (params.netmask !== undefined) data.netmask = params.netmask;
        if (params.gateway !== undefined) data.gateway = params.gateway;
        if (params.bridge_ports !== undefined) data.bridge_ports = params.bridge_ports;
        if (params.autostart !== undefined) data.autostart = params.autostart ? 1 : 0;

        const result = await proxmox.put(
          `/nodes/${params.node}/network/${params.iface}`,
          data
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
    "delete_network",
    "Delete network interface",
    {
      node: z.string().describe("The name of the node"),
      iface: z.string().describe("The network interface name"),
    },
    {
      destructiveHint: true,
    },
    async (params) => {
      try {
        const result = await proxmox.delete(
          `/nodes/${params.node}/network/${params.iface}`
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
