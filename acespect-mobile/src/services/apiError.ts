import axios from 'axios';

/**
 * Turns any thrown value (axios error, network failure, timeout) into a
 * human-readable message, preferring the backend's `{ error: { message } }`.
 */
export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    if (data?.error?.message) return data.error.message;
    if (err.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
    if (!err.response) return 'Cannot reach the server. Check your connection.';
  }
  return fallback;
}
