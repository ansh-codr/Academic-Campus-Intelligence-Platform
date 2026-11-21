// Base API client configured with graceful fallback to centralized demo fixtures
const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: { message: string } }> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      return {
        success: false,
        error: {
          message: errJson?.error?.message || `API request failed with HTTP ${res.status}`,
        },
      };
    }

    const data = await res.json();
    return { success: true, data: data.data !== undefined ? data.data : data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network communication error';
    return {
      success: false,
      error: { message: msg },
    };
  }
}
