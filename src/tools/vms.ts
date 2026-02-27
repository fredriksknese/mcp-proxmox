import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProxmoxClient } from "../api/client.js";

export function registerVmTools(server: McpServer, proxmox: ProxmoxClient): void {
  // ─── Query tools ───────────────────────────────────────────────────────────

  server.tool(
    "list_vms",
    "List all VMs across all nodes or on a specific node",
    {
      node: z.string().optional().describe("Node name to list VMs from (omit for all nodes)"),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async (params) => {
      try {
        let result;
        if (params.node) {
          result = await proxmox.get(`/nodes/${params.node}/qemu`);
        } else {
          result = await proxmox.get("/cluster/resources", { type: "vm" });
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
    "get_vm_status",
    "Get current status of a VM",
    {
      node: z.string().describe("The node name"),
      vmid: z.number().describe("The VM ID"),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async (params) => {
      try {
        const result = await proxmox.get(`/nodes/${params.node}/qemu/${params.vmid}/status/current`);
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
    "get_vm_config",
    "Get VM configuration",
    {
      node: z.string().describe("The node name"),
      vmid: z.number().describe("The VM ID"),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async (params) => {
      try {
        const result = await proxmox.get(`/nodes/${params.node}/qemu/${params.vmid}/config`);
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

  // ─── CRUD tools ────────────────────────────────────────────────────────────

  server.tool(
    "create_vm",
    "Create a new VM",
    {
      node: z.string().describe("The node name"),
      vmid: z.number().describe("The VM ID"),
      name: z.string().optional().describe("The VM name"),
      memory: z.number().optional().describe("Memory in MB"),
      cores: z.number().optional().describe("Number of CPU cores"),
      sockets: z.number().optional().describe("Number of CPU sockets"),
      ostype: z.string().optional().describe("OS type (e.g. l26, win10)"),
      cdrom: z.string().optional().describe("CD-ROM device"),
      scsi0: z.string().optional().describe("SCSI disk 0 configuration"),
      net0: z.string().optional().describe("Network device 0 configuration"),
      ide2: z.string().optional().describe("IDE device 2 configuration"),
      boot: z.string().optional().describe("Boot order"),
      scsihw: z.string().optional().describe("SCSI controller type"),
    },
    {
      destructiveHint: false,
    },
    async (params) => {
      try {
        const { node, ...vmParams } = params;
        const data: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(vmParams)) {
          if (value !== undefined) {
            data[key] = value;
          }
        }
        const result = await proxmox.post(`/nodes/${node}/qemu`, data);
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
    "update_vm_config",
    "Update VM configuration",
    {
      node: z.string().describe("The node name"),
      vmid: z.number().describe("The VM ID"),
      name: z.string().optional().describe("The VM name"),
      memory: z.number().optional().describe("Memory in MB"),
      cores: z.number().optional().describe("Number of CPU cores"),
      sockets: z.number().optional().describe("Number of CPU sockets"),
      description: z.string().optional().describe("VM description"),
    },
    {
      destructiveHint: false,
      idempotentHint: true,
    },
    async (params) => {
      try {
        const { node, vmid, ...configParams } = params;
        const data: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(configParams)) {
          if (value !== undefined) {
            data[key] = value;
          }
        }
        const result = await proxmox.put(`/nodes/${node}/qemu/${vmid}/config`, data);
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
    "delete_vm",
    "Delete a VM",
    {
      node: z.string().describe("The node name"),
      vmid: z.number().describe("The VM ID"),
      purge: z.boolean().optional().describe("Purge VM from configurations"),
      "destroy-unreferenced-disks": z.boolean().optional().describe("Destroy unreferenced disks owned by the VM"),
    },
    {
      destructiveHint: true,
    },
    async (params) => {
      try {
        const queryParams: Record<string, string> = {};
        if (params.purge !== undefined) {
          queryParams.purge = params.purge ? "1" : "0";
        }
        if (params["destroy-unreferenced-disks"] !== undefined) {
          queryParams["destroy-unreferenced-disks"] = params["destroy-unreferenced-disks"] ? "1" : "0";
        }
        const result = await proxmox.delete(`/nodes/${params.node}/qemu/${params.vmid}`, queryParams);
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

  // ─── Power tools (data-driven) ────────────────────────────────────────────

  const powerActions = [
    { name: "start_vm", action: "start", description: "Start a VM" },
    { name: "stop_vm", action: "stop", description: "Stop a VM (immediate)" },
    { name: "shutdown_vm", action: "shutdown", description: "Gracefully shutdown a VM" },
    { name: "reboot_vm", action: "reboot", description: "Reboot a VM" },
    { name: "suspend_vm", action: "suspend", description: "Suspend a VM" },
    { name: "resume_vm", action: "resume", description: "Resume a suspended VM" },
    { name: "reset_vm", action: "reset", description: "Reset a VM (immediate)" },
  ];

  for (const { name, action, description } of powerActions) {
    server.tool(
      name,
      description,
      {
        node: z.string().describe("The node name"),
        vmid: z.number().describe("The VM ID"),
      },
      {
        destructiveHint: false,
      },
      async (params) => {
        try {
          const result = await proxmox.post(`/nodes/${params.node}/qemu/${params.vmid}/status/${action}`);
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

  // ─── Operation tools ──────────────────────────────────────────────────────

  server.tool(
    "clone_vm",
    "Clone a VM",
    {
      node: z.string().describe("The node name"),
      vmid: z.number().describe("The source VM ID"),
      newid: z.number().describe("The new VM ID for the clone"),
      name: z.string().optional().describe("Name for the cloned VM"),
      full: z.boolean().optional().describe("Full clone (true) or linked clone (false)"),
      target: z.string().optional().describe("Target node for the clone"),
      storage: z.string().optional().describe("Target storage for the clone"),
    },
    {
      destructiveHint: false,
    },
    async (params) => {
      try {
        const { node, vmid, ...cloneParams } = params;
        const data: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(cloneParams)) {
          if (value !== undefined) {
            data[key] = value;
          }
        }
        const result = await proxmox.post(`/nodes/${node}/qemu/${vmid}/clone`, data);
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
    "migrate_vm",
    "Migrate a VM to another node",
    {
      node: z.string().describe("The current node name"),
      vmid: z.number().describe("The VM ID"),
      target: z.string().describe("The target node name"),
      online: z.boolean().optional().describe("Online migration (true for live migration)"),
    },
    {
      destructiveHint: false,
    },
    async (params) => {
      try {
        const data: Record<string, unknown> = {
          target: params.target,
        };
        if (params.online !== undefined) {
          data.online = params.online;
        }
        const result = await proxmox.post(`/nodes/${params.node}/qemu/${params.vmid}/migrate`, data);
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
    "resize_vm_disk",
    "Resize a VM disk",
    {
      node: z.string().describe("The node name"),
      vmid: z.number().describe("The VM ID"),
      disk: z.string().describe("The disk to resize (e.g. scsi0, virtio0)"),
      size: z.string().describe("New size or size increment (e.g. \"+10G\")"),
    },
    {
      destructiveHint: false,
    },
    async (params) => {
      try {
        const result = await proxmox.put(`/nodes/${params.node}/qemu/${params.vmid}/resize`, {
          disk: params.disk,
          size: params.size,
        });
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

  // ─── Snapshot tools ───────────────────────────────────────────────────────

  server.tool(
    "list_vm_snapshots",
    "List all snapshots of a VM",
    {
      node: z.string().describe("The node name"),
      vmid: z.number().describe("The VM ID"),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async (params) => {
      try {
        const result = await proxmox.get(`/nodes/${params.node}/qemu/${params.vmid}/snapshot`);
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
    "create_vm_snapshot",
    "Create a snapshot of a VM",
    {
      node: z.string().describe("The node name"),
      vmid: z.number().describe("The VM ID"),
      snapname: z.string().describe("The snapshot name"),
      description: z.string().optional().describe("Snapshot description"),
    },
    {
      destructiveHint: false,
    },
    async (params) => {
      try {
        const data: Record<string, unknown> = {
          snapname: params.snapname,
        };
        if (params.description !== undefined) {
          data.description = params.description;
        }
        const result = await proxmox.post(`/nodes/${params.node}/qemu/${params.vmid}/snapshot`, data);
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
    "delete_vm_snapshot",
    "Delete a snapshot of a VM",
    {
      node: z.string().describe("The node name"),
      vmid: z.number().describe("The VM ID"),
      snapname: z.string().describe("The snapshot name"),
    },
    {
      destructiveHint: true,
    },
    async (params) => {
      try {
        const result = await proxmox.delete(`/nodes/${params.node}/qemu/${params.vmid}/snapshot/${params.snapname}`);
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
    "rollback_vm_snapshot",
    "Rollback a VM to a snapshot",
    {
      node: z.string().describe("The node name"),
      vmid: z.number().describe("The VM ID"),
      snapname: z.string().describe("The snapshot name"),
    },
    {
      destructiveHint: true,
    },
    async (params) => {
      try {
        const result = await proxmox.post(`/nodes/${params.node}/qemu/${params.vmid}/snapshot/${params.snapname}/rollback`);
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

  // ─── Agent tools ──────────────────────────────────────────────────────────

  server.tool(
    "get_vm_agent_info",
    "Get QEMU guest agent info",
    {
      node: z.string().describe("The node name"),
      vmid: z.number().describe("The VM ID"),
    },
    {
      readOnlyHint: true,
      destructiveHint: false,
    },
    async (params) => {
      try {
        const result = await proxmox.get(`/nodes/${params.node}/qemu/${params.vmid}/agent/info`);
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
    "execute_vm_command",
    "Execute command via QEMU guest agent",
    {
      node: z.string().describe("The node name"),
      vmid: z.number().describe("The VM ID"),
      command: z.string().describe("The command to execute"),
    },
    {
      destructiveHint: true,
    },
    async (params) => {
      try {
        const result = await proxmox.post(`/nodes/${params.node}/qemu/${params.vmid}/agent/exec`, {
          command: params.command,
        });
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
