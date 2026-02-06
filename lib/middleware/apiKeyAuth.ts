// API Key Authentication Middleware
// Used to protect cron job endpoints from unauthorized access
// Validates API key passed in x-api-key header

/**
 * Validate API key for cron job authentication
 * @param apiKey - API key from request header
 * @returns true if valid, false otherwise
 */
export function validateApiKey(apiKey: string | null): boolean {
  if (!apiKey) {
    return false;
  }

  const validApiKey = process.env.CRON_API_KEY;

  if (!validApiKey) {
    console.error('CRON_API_KEY environment variable not set');
    return false;
  }

  return apiKey === validApiKey;
}
