import { setTimeout } from 'timers/promises';

interface RetryOptions {
    attempts?: number;
    baseDelayMs?: number;
}

const DEFAULT_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 500;

function isRetryableStatus(status: number): boolean {
    return status === 429 || status >= 500;
}

export async function fetchWithRetry(
    input: RequestInfo | URL,
    init?: RequestInit,
    {
        attempts = DEFAULT_ATTEMPTS,
        baseDelayMs = DEFAULT_BASE_DELAY_MS,
    }: RetryOptions = {}
): Promise<Response> {
    let lastError: unknown = new Error(
        `No fetch attempt was made for ${input}`
    );
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const response = await fetch(input, init);
            if (response.ok || !isRetryableStatus(response.status)) {
                return response;
            }
            lastError = new Error(
                `Request to ${input} failed with status ${response.status}`
            );
        } catch (error) {
            lastError = error;
        }
        if (attempt < attempts) {
            await setTimeout(baseDelayMs * 2 ** (attempt - 1));
        }
    }
    throw lastError;
}
