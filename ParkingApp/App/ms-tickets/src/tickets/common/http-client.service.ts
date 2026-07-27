import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);

  private authHeaders(token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async get<T>(url: string, token?: string): Promise<T> {
    const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) {
      this.logger.error(`GET ${url} failed: ${response.statusText}`);
      throw new Error(`Error fetching ${url}: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  async post<T>(url: string, body: any, token?: string): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: this.authHeaders(token),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      this.logger.error(`POST ${url} failed: ${response.statusText}`);
      throw new Error(`POST ${url} failed: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  async patch<T>(url: string, body: any, token?: string): Promise<T> {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.authHeaders(token),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      this.logger.error(`PATCH ${url} failed: ${response.statusText}`);
      throw new Error(`PATCH ${url} failed: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

}
