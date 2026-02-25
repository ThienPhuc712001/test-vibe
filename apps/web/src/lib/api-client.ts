import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp for debugging
        config.metadata = { startTime: new Date() };
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Calculate request duration
        const endTime = new Date();
        const duration = endTime.getTime() - response.config.metadata.startTime.getTime();
        
        // Log request duration in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`API Request to ${response.config.url} took ${duration}ms`);
        }

        return response;
      },
      (error) => {
        // Handle common errors
        if (error.response?.status === 401) {
          // Unauthorized - redirect to login
          this.handleUnauthorized();
        } else if (error.response?.status === 403) {
          // Forbidden - show permission error
          this.handleForbidden();
        } else if (error.response?.status >= 500) {
          // Server error - show generic error message
          this.handleServerError();
        }

        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }
    return null;
  }

  private handleUnauthorized(): void {
    if (typeof window !== 'undefined') {
      // Clear auth tokens
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      
      // Redirect to login
      window.location.href = '/sign-in';
    }
  }

  private handleForbidden(): void {
    // Show forbidden error message
    console.error('Access forbidden: You do not have permission to access this resource');
  }

  private handleServerError(): void {
    // Show server error message
    console.error('Server error: Something went wrong. Please try again later.');
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config);
  }

  // File upload
  async upload<T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
  }

  // Download file
  async download(url: string, filename?: string, config?: AxiosRequestConfig): Promise<void> {
    const response = await this.client.get(url, {
      ...config,
      responseType: 'blob',
    });

    // Create download link
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // Set auth token
  setAuthToken(token: string, persist = true): void {
    if (typeof window !== 'undefined') {
      if (persist) {
        localStorage.setItem('authToken', token);
      } else {
        sessionStorage.setItem('authToken', token);
      }
    }
  }

  // Clear auth token
  clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
    }
  }

  // Get client instance for custom requests
  getClient(): AxiosInstance {
    return this.client;
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export types
export type { AxiosRequestConfig, AxiosResponse };