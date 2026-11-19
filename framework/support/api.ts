/**
 * File: framework/support/api.ts
 * Purpose: Provides a thin APIRequestContext wrapper for approved test calls.
 * Maintainer: Lakshmikiran J. | Project: TaskyMed QA
 * Origin: Manually maintained; endpoint methods must follow verified contracts.
 * Usage: Consumed by support/test.ts and API specs. Edit manually; never add guessed endpoints.
 */
import type { APIRequestContext, APIResponse } from '@playwright/test';
export class ApiClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string,
  ) {}

  // Keep request construction in one small wrapper so tests use the validated
  // environment API base URL without inventing endpoint behavior.
  protected call(
    path: string,
    init?: Parameters<APIRequestContext['fetch']>[1],
  ): Promise<APIResponse> {
    return this.request.fetch(new URL(path, this.baseUrl).toString(), init);
  }

  /** Sends a read-only GET request to a verified relative API path. */
  get(path: string): Promise<APIResponse> {
    return this.call(path, { method: 'GET' });
  }
}
