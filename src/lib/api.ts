/**
 * xvChat API client — все запросы к backend
 * JWT токен хранится в localStorage, передаётся через X-Authorization header
 */

const URLS = {
  auth: "https://functions.poehali.dev/e8fd812f-ea5d-4496-8ad5-206c0076d9d4",
  chats: "https://functions.poehali.dev/9d87d322-7a4c-4882-86a3-eb896ce2a48d",
  messages: "https://functions.poehali.dev/5572b794-1d0b-45a2-95d0-ebb5d0f8cb39",
  profile: "https://functions.poehali.dev/a0e5e641-579f-43ae-8277-3f917f4f7cee",
};

export const TOKEN_KEY = "xvchat_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}`, "X-Authorization": `Bearer ${token}` } : {};
}

async function request<T>(
  base: keyof typeof URLS,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${URLS[base]}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeaders(),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Ошибка ${res.status}`);
  }
  return data as T;
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  custom_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  bio: string;
  status: "online" | "offline" | "away" | "busy";
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const auth = {
  register: (data: { name: string; email?: string; phone?: string; password: string }) =>
    request<AuthResponse>("auth", "/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email?: string; phone?: string; password: string }) =>
    request<AuthResponse>("auth", "/login", { method: "POST", body: JSON.stringify(data) }),

  me: () => request<{ user: User }>("auth", "/me", { method: "GET" }),

  logout: () => request<{ ok: boolean }>("auth", "/logout", { method: "POST" }),

  accountsByIp: () => request<{ accounts: User[] }>("auth", "/accounts-by-ip", { method: "GET" }),
};

// ─── CHATS ───────────────────────────────────────────────────────────────────

export interface Chat {
  id: string;
  is_group: boolean;
  group_name: string | null;
  group_avatar: string | null;
  other_user: User | null;
  last_message: { content: string; type: string; at: string } | null;
  unread_count: number;
  updated_at: string | null;
}

export const chats = {
  list: () => request<{ chats: Chat[] }>("chats", "/", { method: "GET" }),

  create: (data: { user_id?: string; is_group?: boolean; group_name?: string }) =>
    request<{ chat_id: string; existing: boolean }>("chats", "/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  search: (q: string) =>
    request<{ users: User[] }>( "chats", `/search?q=${encodeURIComponent(q)}`, { method: "GET" }),

  getUser: (userId: string) =>
    request<{ user: User }>("chats", `/user/${userId}`, { method: "GET" }),
};

// ─── MESSAGES ────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string | null;
  content_type: string;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  duration: number | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  temp_id?: string;
  sender: { name: string; avatar: string | null; custom_id: string };
}

export const messages = {
  list: (chatId: string, opts?: { limit?: number; before?: string }) => {
    const params = new URLSearchParams({ chat_id: chatId });
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.before) params.set("before", opts.before);
    return request<{ messages: Message[] }>("messages", `/?${params}`, { method: "GET" });
  },

  send: (data: { chat_id: string; content: string; content_type?: string; temp_id?: string }) =>
    request<{ message: Message; status: string }>("messages", "/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  poll: (chatId: string, after: string) =>
    request<{ messages: Message[]; has_new: boolean }>(
      "messages",
      `/poll?chat_id=${chatId}&after=${encodeURIComponent(after)}`,
      { method: "GET" }
    ),

  markRead: (chatId: string, messageIds?: string[]) =>
    request<{ ok: boolean }>("messages", "/read", {
      method: "PUT",
      body: JSON.stringify({ chat_id: chatId, message_ids: messageIds || [] }),
    }),
};

// ─── PROFILE ─────────────────────────────────────────────────────────────────

export const profile = {
  get: () => request<{ user: User }>("profile", "/", { method: "GET" }),

  update: (data: Partial<{ name: string; bio: string; phone: string; email: string }>) =>
    request<{ user: User }>("profile", "/", { method: "PUT", body: JSON.stringify(data) }),

  uploadAvatar: (imageBase64: string) =>
    request<{ avatar_url: string }>("profile", "/avatar", {
      method: "POST",
      body: JSON.stringify({ image: imageBase64 }),
    }),

  changePassword: (oldPassword: string, newPassword: string) =>
    request<{ ok: boolean }>("profile", "/password", {
      method: "PUT",
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    }),

  setStatus: (status: string) =>
    request<{ ok: boolean; status: string }>("profile", "/status", {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
};
