import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ProxmoxClient } from "../api/client.js";

export function registerResources(server: McpServer, proxmox: ProxmoxClient): void {
  // Static resource: list all Proxmox cluster nodes
  server.resource("nodes", "proxmox://nodes", { description: "List of all Proxmox cluster nodes" }, async (uri) => {
    const nodes = await proxmox.get("/nodes");
    return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(nodes, null, 2) }] };
  });

  // Dynamic resource template: list VMs on a specific node
  server.resource("node-vms", new ResourceTemplate("proxmox://nodes/{node}/vms", { list: undefined }), { description: "List VMs on a specific node" }, async (uri, { node }) => {
    const vms = await proxmox.get(`/nodes/${node}/qemu`);
    return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(vms, null, 2) }] };
  });

  // Dynamic resource template: list containers on a specific node
  server.resource("node-containers", new ResourceTemplate("proxmox://nodes/{node}/containers", { list: undefined }), { description: "List containers on a specific node" }, async (uri, { node }) => {
    const containers = await proxmox.get(`/nodes/${node}/lxc`);
    return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(containers, null, 2) }] };
  });

  // Static resource: Proxmox cluster status
  server.resource("cluster-status", "proxmox://cluster/status", { description: "Proxmox cluster status" }, async (uri) => {
    const status = await proxmox.get("/cluster/status");
    return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(status, null, 2) }] };
  });
}
