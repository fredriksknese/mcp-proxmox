import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProxmoxClient } from "../api/client.js";

export function registerContainerTools(server: McpServer, proxmox: ProxmoxClient): void {
  // ── Query tools ──────────────────────────────────────────────────────

  server.tool(
    "list_containers",
    "List LXC containers",
    {
      node: z.string().optional().describe("Node name; if omitted, lists containers across the entire cluster"),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async (params) => {
      try {
        let result: unknown;
        if (params.node) {
          result = await proxmox.get(`/nodes/${params.node}/lxc`);
        } else {
          const resources = await proxmox.get<Array<{ type: string }>>(
            "/cluster/resources",
            { type: "vm" }
          );
          result = resources.filter((r) => r.type === "lxc");
        }
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
    "get_container_status",
    "Get container status",
    {
      node: z.string().describe("The node name"),
      vmid: z.number().describe("The container VMID"),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async (params) => {
      try {
        const result = await proxmox.get(
          `/nodes/${params.node}/lxc/${params.vmid}/status/current`
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
    "get_container_config",
    "Get container config",
    {
      node: z.string().describe("The node name"),
      vmid: z.number().describe("The container VMID"),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async (params) => {
      try {
        const result = await proxmox.get(
          `/nodes/${params.node}/lxc/${params.vmid}/config`
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

  // ── CRUD tools ───────────────────────────────────────────────────────

  server.tool(
    "create_container",
    "Create LXC container",
    {
      node: z.string().describe("The node name"),
      vmid: z.number().describe("The container VMID"),
      ostemplate: z.string().describe("OS template (e.g. \"local:vztmpl/debian-12-standard_12.2-1_amd64.tar.zst\")"),
      hostname: z.string().optional().describe("Container hostname"),
      memory: z.number().optional().describe("Memory in MB"),
      swap: z.number().optional().describe("Swap in MB"),
      cores: z.number().optional().describe("Number of CPU cores"),
      rootfs: z.string().optional().describe("Root filesystem (e.g. \"local-lvm:8\")"),
      password: z.string().optional().describe("Root password"),
      "ssh-public-keys": z.string().optional().describe("SSH public keys"),
      net0: z.string().optional().describe("Network config (e.g. \"name=eth0,bridge=vmbr0,ip=dhcp\")"),
      storage: z.string().optional().describe("Default storage"),
      unprivileged: z.boolean().optional().describe("Create as unprivileged container"),
    },
    {
      destructiveHint: false,
    },
    async (params) => {
      try {
        const { node, ...body } = params;
        const result = await proxmox.post(`/nodes/${node}/lxc`, body);
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
    "update_container_config",
    "Update container config",
    {
      node: z.string().describe("The node name"),
      vmid: z.number().describe("The container VMID"),
      hostname: z.string().optional().describe("Container hostname"),
      memory: z.number().optional().describe("Memory in MB"),
      swap: z.number().optional().describe("Swap in MB"),
      cores: z.number().optional().describe("Number of CPU cores"),
      description: z.string().optional().describe("Container description"),
    },
    {
      destructiveHint: false,
      idempotentHint: true,
    },
    async (params) => {
      try {
        const { node, vmid, ...body } = params;
        const result = await proxmox.put(
          `/nodes/${node}/lxc/${vmid}/config`,
          body
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
    "delete_container",
    "Delete container",
    {
      node: z.string().describe("The node name"),
      vmid: z.number().describe("The container VMID"),
      purge: z.boolean().optional().describe("Remove container from all related configurations"),
      force: z.boolean().optional().describe("Force destruction even if running"),
    },
    {
      destructiveHint: true,
    },
    async (params) => {
      try {
        const queryParams: Record<string, string> = {};
        if (params.purge !== undefined) queryParams.purge = params.purge ? "1" : "0";
        if (params.force !== undefined) queryParams.force = params.force ? "1" : "0";
        const result = await proxmox.delete(
          `/nodes/${params.node}/lxc/${params.vmid}`,
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

  // ── Power tools ──────────────────────────────────────────────────────

  const powerActions = [
    { name: "start_container", action: "start", description: "Start a container" },
    { name: "stop_container", action: "stop", description: "Stop a container (immediate)" },
    { name: "shutdown_container", action: "shutdown", description: "Gracefully shutdown a container" },
    { name: "reboot_container", action: "reboot", description: "Reboot a container" },
  ];

  for (const { name, action, description } of powerActions) {
    server.tool(
      name,
      description,
      {
        node: z.string().describe("The node name"),
        vmid: z.number().describe("The container VMID"),
      },
      {
        destructiveHint: false,
      },
      async (params) => {
        try {
          const result = await proxmox.post(
            `/nodes/${params.node}/lxc/${params.vmid}/status/${action}`
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

  // ── Snapshot tools ───────────────────────────────────────────────────

  server.tool(
    "list_container_snapshots",
    "List container snapshots",
    {
      node: z.string().describe("The node name"),
      vmid: z.number().describe("The container VMID"),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async (params) => {
      try {
        const result = await proxmox.get(
          `/nodes/${params.node}/lxc/${params.vmid}/snapshot`
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
    "create_container_snapshot",
    "Create a container snapshot",
    {
      node: z.string().describe("The node name"),
      vmid: z.number().describe("The container VMID"),
      snapname: z.string().describe("The snapshot name"),
      description: z.string().optional().describe("Snapshot description"),
    },
    {
      destructiveHint: false,
    },
    async (params) => {
      try {
        const { node, vmid, ...body } = params;
        const result = await proxmox.post(
          `/nodes/${node}/lxc/${vmid}/snapshot`,
          body
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
    "delete_container_snapshot",
    "Delete a container snapshot",
    {
      node: z.string().describe("The node name"),
      vmid: z.number().describe("The container VMID"),
      snapname: z.string().describe("The snapshot name"),
    },
    {
      destructiveHint: true,
    },
    async (params) => {
      try {
        const result = await proxmox.delete(
          `/nodes/${params.node}/lxc/${params.vmid}/snapshot/${params.snapname}`
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
    "rollback_container_snapshot",
    "Rollback a container to a snapshot",
    {
      node: z.string().describe("The node name"),
      vmid: z.number().describe("The container VMID"),
      snapname: z.string().describe("The snapshot name"),
    },
    {
      destructiveHint: true,
    },
    async (params) => {
      try {
        const result = await proxmox.post(
          `/nodes/${params.node}/lxc/${params.vmid}/snapshot/${params.snapname}/rollback`
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
