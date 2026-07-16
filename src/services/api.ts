import { config } from '../config';

const API_BASE_URL = config.API_URL;

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('token');
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.getToken()) {
      headers.Authorization = `Bearer ${this.getToken()}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      if (error.message === 'Failed to fetch' || error.name === 'TypeError' || error.message?.includes('fetch')) {
        const backendUrl = API_BASE_URL.replace('/api', '');
        throw new Error(
          `No se pudo conectar con el servidor en ${backendUrl}. Verifica que el backend esté corriendo y que CORS esté configurado correctamente.`
        );
      }
      throw error;
    }
  }

  // Auth endpoints
  async login(username: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async verifyToken() {
    return this.request('/auth/verify');
  }

  // Event endpoints
  async getEvent() {
    return this.request('/events');
  }

  async createEvent(eventData: any) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(id: string, eventData: any) {
    return this.request(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  // Gift endpoints
  async getGifts(params?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.minPrice) queryParams.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);

    const query = queryParams.toString();
    return this.request(`/gifts${query ? `?${query}` : ''}`);
  }

  async getGift(id: string) {
    return this.request(`/gifts/${id}`);
  }

  async contributeToGift(id: string, amount: number) {
    return this.request(`/gifts/${id}/contribute`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async createGift(giftData: any) {
    return this.request('/gifts', {
      method: 'POST',
      body: JSON.stringify(giftData),
    });
  }

  async updateGift(id: string, giftData: any) {
    return this.request(`/gifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(giftData),
    });
  }

  async deleteGift(id: string) {
    return this.request(`/gifts/${id}`, {
      method: 'DELETE',
    });
  }

      // Payment endpoints
      async confirmPayment(
        giftIds: string[], 
        paymentMethod?: string, 
        paymentReference?: string, 
        amounts?: number[],
        receiptBase64?: string
      ) {
        const body = {
          giftIds,
          paymentMethod: paymentMethod || 'Transferencia',
          paymentReference: paymentReference || '',
          amounts: amounts || [],
          receiptBase64: receiptBase64 || null
        };

        return this.request('/payments/confirm', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }

      // Category endpoints
      async getCategories(includeInactive?: boolean) {
        const params = includeInactive ? '?includeInactive=true' : '';
        return this.request(`/categories${params}`);
      }

      async getCategory(id: string) {
        return this.request(`/categories/${id}`);
      }

      async createCategory(categoryData: { name: string; description?: string; isActive?: boolean }) {
        return this.request('/categories', {
          method: 'POST',
          body: JSON.stringify(categoryData),
        });
      }

      async updateCategory(id: string, categoryData: { name?: string; description?: string; isActive?: boolean }) {
        return this.request(`/categories/${id}`, {
          method: 'PUT',
          body: JSON.stringify(categoryData),
        });
      }

      async deleteCategory(id: string) {
        return this.request(`/categories/${id}`, {
          method: 'DELETE',
        });
      }

      // Report endpoints
      async getContributionsReport() {
        return this.request('/reports/contributions');
      }

      async getSummaryReport() {
        return this.request('/reports/summary');
      }

      // Admin endpoints
      async createGiftCards(config: {
        amounts: number[];
        quantities: { [key: number]: number };
        themes: Array<{ name: string; emoji: string; imageUrl: string }>;
      }) {
        return this.request('/gifts/gift-cards', {
          method: 'POST',
          body: JSON.stringify(config),
        });
      }

      // Import endpoints
      async importGiftsFromUrl(url: string, category?: string, categoryId?: number) {
        return this.request('/import/gifts', {
          method: 'POST',
          body: JSON.stringify({ url, category, categoryId }),
        });
      }

      async importGiftsFromCSV(csvContent: string, category?: string, categoryId?: number, baseImageUrl?: string) {
        return this.request('/import/csv', {
          method: 'POST',
          body: JSON.stringify({ csvContent, category, categoryId, baseImageUrl }),
        });
      }

      // User management endpoints (admin only)
      async getUsers() {
        return this.request('/auth/users');
      }

      async createUser(userData: { username: string; password: string; role?: 'admin' | 'guest' }) {
        return this.request('/auth/users', {
          method: 'POST',
          body: JSON.stringify(userData),
        });
      }

      async deleteUser(userId: number) {
        return this.request(`/auth/users/${userId}`, {
          method: 'DELETE',
        });
      }

      // Dedication endpoints
      async getDedications(limit?: number) {
        const params = limit ? `?limit=${limit}` : '';
        return this.request(`/dedications${params}`);
      }

      async createDedication(dedicationData: { message: string; senderName?: string }) {
        return this.request('/dedications', {
          method: 'POST',
          body: JSON.stringify(dedicationData),
        });
      }

      // Admin dedication endpoints
      async getAllDedications() {
        return this.request('/dedications/admin');
      }

      async updateDedication(id: string, dedicationData: { message?: string; senderName?: string; isApproved?: boolean }) {
        return this.request(`/dedications/${id}`, {
          method: 'PUT',
          body: JSON.stringify(dedicationData),
        });
      }

      async deleteDedication(id: string) {
        return this.request(`/dedications/${id}`, {
          method: 'DELETE',
        });
      }
    }

    export const apiService = new ApiService();
