import { API_URL } from "./constants";

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

  // Events
  async getEvents(token?: string) {
    return this.request("/api/events", { token });
  }

  async getEvent(id: string) {
    return this.request(`/api/events/${id}`);
  }

  async getEventBySlug(slug: string) {
    return this.request(`/api/events/slug/${slug}`);
  }

  async createEvent(data: CreateEventData, token: string) {
    return this.request("/api/events", { method: "POST", body: data, token });
  }

  async updateEvent(id: string, data: Partial<CreateEventData>, token: string) {
    return this.request(`/api/events/${id}`, { method: "PATCH", body: data, token });
  }

  async deleteEvent(id: string, token: string) {
    return this.request(`/api/events/${id}`, { method: "DELETE", token });
  }

  // Tickets
  async getEventTickets(eventId: string, token: string) {
    return this.request(`/api/events/${eventId}/tickets`, { token });
  }

  async purchaseTicket(eventId: string, tierId: string, walletAddress: string) {
    return this.request(`/api/events/${eventId}/tickets/purchase`, {
      method: "POST",
      body: { tierId, walletAddress },
    });
  }

  async getTicket(ticketId: string) {
    return this.request(`/api/tickets/${ticketId}`);
  }

  async getMyTickets(walletAddress: string) {
    return this.request(`/api/tickets/wallet/${walletAddress}`);
  }

  async checkInTicket(ticketId: string, token: string) {
    return this.request(`/api/tickets/${ticketId}/check-in`, { method: "POST", token });
  }

  async transferTicket(ticketId: string, toAddress: string, token: string) {
    return this.request(`/api/tickets/${ticketId}/transfer`, {
      method: "POST",
      body: { toAddress },
      token,
    });
  }

  // POAPs
  async getEventPOAPs(eventId: string, token: string) {
    return this.request(`/api/events/${eventId}/poaps`, { token });
  }

  async claimPOAP(poapId: string, walletAddress: string) {
    return this.request(`/api/poaps/${poapId}/claim`, {
      method: "POST",
      body: { walletAddress },
    });
  }

  async getMyPOAPs(walletAddress: string) {
    return this.request(`/api/poaps/wallet/${walletAddress}`);
  }

  // Attendees
  async getAttendees(eventId: string, token: string, page: number = 1) {
    return this.request(`/api/events/${eventId}/attendees?page=${page}`, { token });
  }

  // Analytics
  async getEventAnalytics(eventId: string, token: string) {
    return this.request(`/api/events/${eventId}/analytics`, { token });
  }

  // Webhooks
  async getWebhooks(eventId: string, token: string) {
    return this.request(`/api/events/${eventId}/webhooks`, { token });
  }

  async createWebhook(eventId: string, data: { url: string; events: string[] }, token: string) {
    return this.request(`/api/events/${eventId}/webhooks`, { method: "POST", body: data, token });
  }

  async deleteWebhook(eventId: string, webhookId: string, token: string) {
    return this.request(`/api/events/${eventId}/webhooks/${webhookId}`, { method: "DELETE", token });
  }

  // Auth
  async getAuthChallenge(publicKey: string) {
    return this.request("/api/auth/challenge", { method: "POST", body: { publicKey } });
  }

  async verifyAuth(signedTransaction: string) {
    return this.request("/api/auth/verify", { method: "POST", body: { signedTransaction } });
  }

  // Profile
  async getProfile(walletAddress: string) {
    return this.request(`/api/profile/${walletAddress}`);
  }

  async updateProfile(data: Record<string, unknown>, token: string) {
    return this.request("/api/profile", { method: "PATCH", body: data, token });
  }
}

export interface CreateEventData {
  name: string;
  description: string;
  date: string;
  endDate?: string;
  venue: string;
  location?: string;
  imageUrl?: string;
  tiers: {
    name: string;
    price: string;
    supply: number;
    description?: string;
    transferable?: boolean;
  }[];
  poap?: {
    enabled: boolean;
    badgeUrl?: string;
    claimDeadline?: string;
  };
}

export const api = new APIClient(API_URL);
export default api;
