# mcp-proxmox

A comprehensive Model Context Protocol (MCP) server for Proxmox VE. Exposes 68 tools and 4 resources covering VMs, containers, storage, networking, clusters, HA, backups, firewall, access control, pools, and tasks.

## Features

- **Nodes** — list nodes, get node status
- **VMs (QEMU)** — full CRUD, power management (start/stop/shutdown/reboot/suspend/resume/reset), clone, migrate, resize disks, snapshots, guest agent
- **Containers (LXC)** — full CRUD, power management, snapshots
- **Storage** — list storage, browse content, download ISOs/templates from URL
- **Networking** — list/create/update/delete network interfaces
- **Cluster** — cluster status and resource overview
- **High Availability** — manage HA resources and groups
- **Backups** — scheduled backup jobs and immediate vzdump
- **Firewall** — cluster and node-level firewall rules
- **Access Control** — list users, groups, roles, permissions (read-only)
- **Resource Pools** — full CRUD for resource pools
- **Tasks** — list and inspect task status

## Installation

```bash
npm install
npm run build
```

## Configuration

Set the following environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PROXMOX_HOST` | Yes | — | Proxmox host (IP or hostname) |
| `PROXMOX_PORT` | No | `8006` | API port |
| `PROXMOX_TOKEN_ID` | Yes | — | API token ID (`user@realm!tokenid`) |
| `PROXMOX_TOKEN_SECRET` | Yes | — | API token secret (UUID) |
| `PROXMOX_ALLOW_SELF_SIGNED_CERTS` | No | `true` | Accept self-signed TLS certificates |

### Creating a Proxmox API Token

1. Log into the Proxmox web UI
2. Go to **Datacenter → Permissions → API Tokens**
3. Click **Add**, select a user, give the token an ID, and uncheck **Privilege Separation** if you want the token to inherit the user's permissions
4. Copy the token ID and secret

## Usage with Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "proxmox": {
      "command": "node",
      "args": ["/path/to/mcp-proxmox/dist/index.js"],
      "env": {
        "PROXMOX_HOST": "192.168.1.100",
        "PROXMOX_TOKEN_ID": "root@pam!mcp",
        "PROXMOX_TOKEN_SECRET": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      }
    }
  }
}
```

## Tools (68 total)

### Nodes (2)
`list_nodes`, `get_node_status`

### VMs (22)
`list_vms`, `get_vm_status`, `get_vm_config`, `create_vm`, `update_vm_config`, `delete_vm`, `start_vm`, `stop_vm`, `shutdown_vm`, `reboot_vm`, `suspend_vm`, `resume_vm`, `reset_vm`, `clone_vm`, `migrate_vm`, `resize_vm_disk`, `list_vm_snapshots`, `create_vm_snapshot`, `delete_vm_snapshot`, `rollback_vm_snapshot`, `get_vm_agent_info`, `execute_vm_command`

### Containers (14)
`list_containers`, `get_container_status`, `get_container_config`, `create_container`, `update_container_config`, `delete_container`, `start_container`, `stop_container`, `shutdown_container`, `reboot_container`, `list_container_snapshots`, `create_container_snapshot`, `delete_container_snapshot`, `rollback_container_snapshot`

### Storage (3)
`list_storage`, `get_storage_content`, `download_url_to_storage`

### Network (4)
`list_networks`, `create_network`, `update_network`, `delete_network`

### Cluster (2)
`get_cluster_status`, `get_cluster_resources`

### High Availability (4)
`list_ha_resources`, `create_ha_resource`, `delete_ha_resource`, `list_ha_groups`

### Backups (3)
`list_backup_jobs`, `create_backup_job`, `run_backup`

### Firewall (3)
`list_firewall_rules`, `create_firewall_rule`, `delete_firewall_rule`

### Access Control (4)
`list_users`, `list_groups`, `list_roles`, `get_permissions`

### Pools (5)
`list_pools`, `create_pool`, `get_pool`, `update_pool`, `delete_pool`

### Tasks (2)
`list_tasks`, `get_task_status`

## Resources (4)

| URI | Description |
|-----|-------------|
| `proxmox://nodes` | List of all cluster nodes |
| `proxmox://nodes/{node}/vms` | VMs on a specific node |
| `proxmox://nodes/{node}/containers` | Containers on a specific node |
| `proxmox://cluster/status` | Cluster status |

## Development

```bash
npm run dev          # Watch mode
npm run build        # Compile TypeScript
npm start            # Run the server
```

### Testing with MCP Inspector

```bash
PROXMOX_HOST=your-host PROXMOX_TOKEN_ID=user@realm!token PROXMOX_TOKEN_SECRET=secret \
  npx @modelcontextprotocol/inspector node dist/index.js
```

## License

MIT
