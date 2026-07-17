const BASE = '/api';

function getToken(): string | null {
  const stored = localStorage.getItem('ebook-auth');
  if (!stored) return null;
  try {
    return JSON.parse(stored).state?.token ?? null;
  } catch {
    return null;
  }
}

async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const text = await res.text();
  if (!text) {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    throw new Error('Empty response from server');
  }
  const data = JSON.parse(text);
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

async function uploadFile(path: string, file: File, extra: Record<string, string> = {}): Promise<BookResponse> {
  const token = getToken();
  const fd = new FormData();
  fd.append('file', file);
  for (const [k, v] of Object.entries(extra)) fd.append(k, v);
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: fd });
  const text = await res.text();
  if (!text) throw new Error('Respuesta vacía del servidor');
  const data = JSON.parse(text);
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as BookResponse;
}

export const api = {
  auth: {
    register: (body: { email: string; password: string; name: string }) =>
      request<{ token: string; user: { id: string; email: string; name: string; role: string } }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) =>
      request<{ token: string; user: { id: string; email: string; name: string; role: string } }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request<{ id: string; email: string; name: string; role: string }>('/auth/me'),
    updateProfile: (name: string) =>
      request<{ id: string; email: string; name: string; role: string }>('/auth/profile', { method: 'PUT', body: JSON.stringify({ name }) }),
    changePassword: (oldPassword: string, newPassword: string) =>
      request<{ success: boolean }>('/auth/password', { method: 'PUT', body: JSON.stringify({ oldPassword, newPassword }) }),
  },
  books: {
    list: () => request<BookResponse[]>('/books'),
    get: (id: string) => request<BookResponse>(`/books/${id}`),
    upload: (file: File, title?: string, author?: string) => {
      const extra: Record<string, string> = {};
      if (title) extra.title = title;
      if (author) extra.author = author;
      return uploadFile('/books', file, extra);
    },
    updateCover: (id: string, coverUrl: string) =>
      request<{ coverUrl: string }>(`/books/${id}/cover`, { method: 'PUT', body: JSON.stringify({ coverUrl }) }),
    search: (id: string, query: string) =>
      request<SearchResult[]>(`/books/${id}/search?q=${encodeURIComponent(query)}`),
  },
  progress: {
    get: (bookId: string) => request<ProgressData>(`/progress/${bookId}`),
    save: (bookId: string, data: Partial<ProgressData>) =>
      request<ProgressData>(`/progress/${bookId}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  notes: {
    list: (bookId: string) => request<NoteData[]>(`/notes/${bookId}`),
    create: (data: { bookId: string; page: number; location: string; text: string; content: string; color?: string }) =>
      request<NoteData>('/notes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { content: string; color?: string }) =>
      request<NoteData>(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/notes/${id}`, { method: 'DELETE' }),
  },
  highlights: {
    list: (bookId: string) => request<HighlightData[]>(`/highlights/${bookId}`),
    create: (data: { bookId: string; page: number; location: string; text: string; color?: string }) =>
      request<HighlightData>('/highlights', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/highlights/${id}`, { method: 'DELETE' }),
  },
  bookmarks: {
    list: (bookId: string) => request<BookmarkData[]>(`/bookmarks/${bookId}`),
    create: (data: { bookId: string; page: number; location: string; label?: string }) =>
      request<BookmarkData>('/bookmarks', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/bookmarks/${id}`, { method: 'DELETE' }),
  },
  stats: {
    get: () => request<StatsData>('/stats'),
  },
  admin: {
    listUsers: () => request<AdminUser[]>('/admin/users'),
    toggleUserActive: (id: string) => request<AdminUser>(`/admin/users/${id}/toggle-active`, { method: 'PUT' }),
    setUserRole: (id: string, role: string) =>
      request<AdminUser>(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
    listBooks: () => request<AdminBook[]>('/admin/books'),
    deleteBook: (id: string) => request<{ success: boolean }>(`/admin/books/${id}`, { method: 'DELETE' }),
  },
  summaries: {
    list: (bookId: string) => request<SummaryData[]>(`/summaries/${bookId}`),
    create: (data: { bookId: string; scope: 'full' | 'chapter' | 'progress'; content: string }) =>
      request<SummaryData>('/summaries', { method: 'POST', body: JSON.stringify(data) }),
  },
};

export interface BookResponse {
  _id: string;
  userId: string;
  title: string;
  author: string;
  description?: string;
  coverUrl: string;
  fileUrl: string;
  format: 'epub' | 'pdf' | 'audio';
  createdAt: string;
  progress: ProgressData | null;
}

export interface ProgressData {
  currentPage: number;
  totalPages: number;
  progress: number;
  location: string;
  lastReadAt: string;
  readingTimeMinutes: number;
}

export interface NoteData {
  _id: string;
  bookId: string;
  page: number;
  location: string;
  text: string;
  content: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface HighlightData {
  _id: string;
  bookId: string;
  page: number;
  location: string;
  text: string;
  color: string;
  createdAt: string;
}

export interface BookmarkData {
  _id: string;
  bookId: string;
  page: number;
  location: string;
  label: string;
  createdAt: string;
}

export interface SearchResult {
  href: string;
  chapterTitle: string;
  snippet: string;
}

export interface StatsData {
  totalBooks: number;
  totalReadingMinutes: number;
  completedBooks: number;
  avgProgress: number;
  recentSessions: {
    bookId: string;
    lastReadAt: string;
    readingTimeMinutes: number;
    progress: number;
  }[];
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface AdminBook extends BookResponse {
  ownerName: string;
  ownerEmail: string;
}

export interface SummaryData {
  _id: string;
  bookId: string;
  scope: 'full' | 'chapter' | 'progress';
  content: string;
  createdAt: string;
}
