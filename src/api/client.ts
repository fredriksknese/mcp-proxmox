import https from "node:https";
import http from "node:http";

export class ProxmoxApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly details: unknown,
  ) {
    super(`Proxmox API error ${statusCode}: ${JSON.stringify(details)}`);
    this.name = "ProxmoxApiError";
  }
}

export interface ProxmoxClientConfig {
  host: string;
  port: number;
  tokenId: string;
  tokenSecret: string;
  allowSelfSignedCerts: boolean;
}

export class ProxmoxClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly rejectUnauthorized: boolean;

  constructor(config: ProxmoxClientConfig) {
    this.baseUrl = `https://${config.host}:${config.port}/api2/json`;
    this.authHeader = `PVEAPIToken=${config.tokenId}=${config.tokenSecret}`;
    this.rejectUnauthorized = !config.allowSelfSignedCerts;
  }

  async get<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (params) {
      const qs = new URLSearchParams(params).toString();
      if (qs) url += `?${qs}`;
    }
    return this.request<T>("GET", url);
  }

  async post<T = unknown>(path: string, data?: Record<string, unknown>): Promise<T> {
    return this.request<T>("POST", `${this.baseUrl}${path}`, data);
  }

  async put<T = unknown>(path: string, data?: Record<string, unknown>): Promise<T> {
    return this.request<T>("PUT", `${this.baseUrl}${path}`, data);
  }

  async delete<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (params) {
      const qs = new URLSearchParams(params).toString();
      if (qs) url += `?${qs}`;
    }
    return this.request<T>("DELETE", url);
  }

  private request<T>(method: string, url: string, data?: Record<string, unknown>): Promise<T> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      let body: string | undefined;
      const headers: Record<string, string> = {
        Authorization: this.authHeader,
      };

      if (data && (method === "POST" || method === "PUT")) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(data)) {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        }
        body = params.toString();
        headers["Content-Type"] = "application/x-www-form-urlencoded";
        headers["Content-Length"] = Buffer.byteLength(body).toString();
      }

      const options: https.RequestOptions = {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method,
        headers,
        rejectUnauthorized: this.rejectUnauthorized,
      };

      const req = https.request(options, (res: http.IncomingMessage) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString();
          let json: { data?: T; errors?: unknown };
          try {
            json = JSON.parse(raw);
          } catch {
            reject(new ProxmoxApiError(res.statusCode ?? 500, raw));
            return;
          }
          if (res.statusCode && res.statusCode >= 400) {
            reject(new ProxmoxApiError(res.statusCode, json.errors ?? json));
            return;
          }
          resolve(json.data as T);
        });
      });

      req.on("error", reject);
      if (body) req.write(body);
      req.end();
    });
  }
}
