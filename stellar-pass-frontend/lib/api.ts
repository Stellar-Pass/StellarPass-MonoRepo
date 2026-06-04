import { API_URL } from "./constants";

const API_PREFIX = "/api/v1";

interface APIResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
}

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<APIResponse<T>> {
    const { method = "GET", body, headers = {}, token } = options;

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.message || data.error || `Request failed with status ${response.status}`,
          statusCode: response.status,
        };
      }

      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Network error occurred",
      };
    }
  }

  // --- Auth ---
  async getAuthChallenge(account: string) {
    return this.request(`${API_PREFIX}/auth/challenge`, {
      method: "POST",
      body: { account },
    });
  }

  async verifyAuth(signedTransaction: string) {
    return this.request(`${API_PREFIX}/auth/token`, {
      method: "POST",
      body: { transaction: signedTransaction },
    });
  }

  async getMe(token: string) {
    return this.request(`${API_PREFIX}/auth/me`, { token });
  }

  // --- Events ---
  async getEvents(params?: { page?: number; limit?: number; status?: string }, token?: string) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.status) searchParams.set("status", params.status);
    const qs = searchParams.toString();
    return this.request(`${API_PREFIX}/events${qs ? `?${qs}` : ""}`, { token });
  }

  async getEvent(id: string) {
    return this.request(`${API_PREFIX}/events/${id}`);
  }

  async createEvent(data: Record<string, unknown>, token: string) {
    return this.request(`${API_PREFIX}/events`, {
      method: "POST",
      body: data,
      token,
    });
  }

  async updateEvent(id: string, data: Record<string, unknown>, token: string) {
    return this.request(`${API_PREFIX}/events/${id}`, {
      method: "PATCH",
      body: data,
      token,
    });
  }

  // --- Tickets ---
  async purchaseTicket(data: { event_id: string; tier_id: string; buyer_wallet: string; payment_asset: string }) {
    return this.request(`${API_PREFIX}/tickets/purchase`, {
      method: "POST",
      body: data,
    });
  }

  async getTicket(ticketId: string, token?: string) {
    return this.request(`${API_PREFIX}/tickets/${ticketId}`, { token });
  }

  async getMyTickets(token: string) {
    return this.request(`${API_PREFIX}/tickets/my`, { token });
  }

  // --- Check-in ---
  async verifyCheckIn(qrPayload: string, organizerWallet: string, token: string) {
    return this.request(`${API_PREFIX}/check-in/verify`, {
      method: "POST",
      body: { qr_payload: qrPayload, organizer_wallet: organizerWallet },
      token,
    });
  }

  async getCheckInStatus(eventId: string, token: string) {
    return this.request(`${API_PREFIX}/check-in/status?event_id=${eventId}`, { token });
  }

  // --- POAPs ---
  async getMyPOAPs(token: string) {
    return this.request(`${API_PREFIX}/poaps/my`, { token });
  }

  async getPOAP(poapId: string) {
    return this.request(`${API_PREFIX}/poaps/${poapId}`);
  }

  // --- Analytics ---
  async getEventAnalytics(eventId: string, token: string) {
    return this.request(`${API_PREFIX}/analytics/${eventId}`, { token });
  }

  // --- Webhooks ---
  async getWebhooks(token: string) {
    return this.request(`${API_PREFIX}/webhooks`, { token });
  }

  async createWebhook(data: { url: string; events: string[] }, token: string) {
    return this.request(`${API_PREFIX}/webhooks`, {
      method: "POST",
      body: data,
      token,
    });
  }

  async deleteWebhook(webhookId: string, token: string) {
    return this.request(`${API_PREFIX}/webhooks/${webhookId}`, {
      method: "DELETE",
      token,
    });
  }

  // --- Organizer ---
  async getOrganizerProfile(token: string) {
    return this.request(`${API_PREFIX}/organizer/me`, { token });
  }

  async updateOrganizerProfile(data: Record<string, unknown>, token: string) {
    return this.request(`${API_PREFIX}/organizer/me`, {
      method: "PATCH",
      body: data,
      token,
    });
  }

  async getOrganizerPayouts(token: string) {
    return this.request(`${API_PREFIX}/organizer/payouts`, { token });
  }
}

export const api = new APIClient(API_URL);
export default api;
