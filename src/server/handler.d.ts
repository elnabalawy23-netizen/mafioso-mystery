import type { RoomStore } from './store';
export interface ApiResult {
    status: number;
    body: Record<string, unknown>;
}
/**
 * Framework-agnostic room API. Both the Vite dev middleware and the production
 * serverless function call this with the parsed JSON payload. Every successful
 * mutation returns the caller's fresh per-player view.
 */
export declare function handleRoom(store: RoomStore, payload: Record<string, any>): Promise<ApiResult>;
