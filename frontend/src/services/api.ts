import { auth } from "@/lib/firebase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
  };
}

interface RequestOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const { headers = {}, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...headers,
    },
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  return response.json();
}

export async function apiUpload<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      ...authHeaders,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(`Upload Error ${response.status}: ${error}`);
  }

  return response.json();
}

export async function apiDownload(endpoint: string): Promise<Blob> {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { ...authHeaders },
  });

  if (!response.ok) {
    throw new Error(`Download Error ${response.status}`);
  }

  return response.blob();
}
