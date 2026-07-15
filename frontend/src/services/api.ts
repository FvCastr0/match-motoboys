const API_BASE_URL = 'http://localhost:3000/api';

export const api = {
  getToken(): string | null {
    return localStorage.getItem('admin_token');
  },

  setToken(token: string) {
    localStorage.setItem('admin_token', token);
  },

  removeToken() {
    localStorage.removeItem('admin_token');
  },

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      this.removeToken();
      // Se não estiver na tela de login, redireciona
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      throw new Error('Sessão expirada ou não autorizada. Redirecionando...');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Erro na requisição: ${response.status}`);
    }

    // Se o status for 204 (No Content) ou se o body for vazio, resolve sem tentar fazer parse de JSON
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  },

  get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  },

  post<T>(path: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(path: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  },
};
