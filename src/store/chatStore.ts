import { create } from "zustand";
import { Chat, Message, chats as chatsApi, messages as messagesApi } from "@/lib/api";

interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
  messages: Record<string, Message[]>;
  loadingChats: boolean;
  loadingMessages: boolean;
  pollingRef: Record<string, ReturnType<typeof setTimeout>>;

  loadChats: () => Promise<void>;
  selectChat: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, content: string) => Promise<void>;
  startPolling: (chatId: string) => void;
  stopPolling: (chatId: string) => void;
  addMessage: (msg: Message) => void;
  createChat: (userId: string) => Promise<string>;
  searchUsers: (q: string) => Promise<{ id: string; name: string; avatar: string | null; status: string; custom_id: string }[]>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChatId: null,
  messages: {},
  loadingChats: false,
  loadingMessages: false,
  pollingRef: {},

  loadChats: async () => {
    set({ loadingChats: true });
    try {
      const { chats } = await chatsApi.list();
      set({ chats });
    } catch {
      // silent
    } finally {
      set({ loadingChats: false });
    }
  },

  selectChat: async (chatId) => {
    set({ activeChatId: chatId, loadingMessages: true });
    const existing = get().messages[chatId];
    if (!existing?.length) {
      try {
        const { messages } = await messagesApi.list(chatId, { limit: 50 });
        set((s) => ({ messages: { ...s.messages, [chatId]: messages.reverse() } }));
      } catch {
        // silent
      }
    }
    set({ loadingMessages: false });
    get().startPolling(chatId);
  },

  addMessage: (msg) => {
    const chatId = msg.chat_id;
    set((s) => {
      const existing = s.messages[chatId] || [];
      const alreadyExists = existing.some((m) => m.id === msg.id);
      if (alreadyExists) return s;
      return {
        messages: { ...s.messages, [chatId]: [...existing, msg] },
        chats: s.chats.map((c) =>
          c.id === chatId
            ? {
                ...c,
                last_message: { content: msg.content || "", type: msg.content_type, at: msg.created_at },
                updated_at: msg.created_at,
              }
            : c
        ),
      };
    });
  },

  sendMessage: async (chatId, content) => {
    const tempId = `tmp_${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      chat_id: chatId,
      sender_id: "__me__",
      content,
      content_type: "text",
      file_url: null,
      file_name: null,
      file_size: null,
      duration: null,
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString(),
      temp_id: tempId,
      sender: { name: "Я", avatar: null, custom_id: "" },
    };
    get().addMessage(tempMsg);

    try {
      const { message } = await messagesApi.send({ chat_id: chatId, content, temp_id: tempId });
      set((s) => ({
        messages: {
          ...s.messages,
          [chatId]: (s.messages[chatId] || []).map((m) =>
            m.id === tempId ? { ...message } : m
          ),
        },
      }));
    } catch {
      // remove temp on error
      set((s) => ({
        messages: {
          ...s.messages,
          [chatId]: (s.messages[chatId] || []).filter((m) => m.id !== tempId),
        },
      }));
    }
  },

  startPolling: (chatId) => {
    const refs = get().pollingRef;
    if (refs[chatId]) return;

    const poll = async () => {
      const msgs = get().messages[chatId] || [];
      const last = msgs[msgs.length - 1];
      const after = last?.created_at || new Date(0).toISOString();

      try {
        const res = await messagesApi.poll(chatId, after);
        if (res.has_new && res.messages.length) {
          res.messages.forEach((m) => get().addMessage(m));
        }
      } catch {
        // silent
      }

      if (get().activeChatId === chatId) {
        const timeout = setTimeout(poll, 500);
        set((s) => ({ pollingRef: { ...s.pollingRef, [chatId]: timeout } }));
      }
    };

    const timeout = setTimeout(poll, 1000);
    set((s) => ({ pollingRef: { ...s.pollingRef, [chatId]: timeout } }));
  },

  stopPolling: (chatId) => {
    const ref = get().pollingRef[chatId];
    if (ref) clearTimeout(ref);
    set((s) => {
      const r = { ...s.pollingRef };
      delete r[chatId];
      return { pollingRef: r };
    });
  },

  createChat: async (userId) => {
    const { chat_id } = await chatsApi.create({ user_id: userId });
    await get().loadChats();
    return chat_id;
  },

  searchUsers: async (q) => {
    const { users } = await chatsApi.search(q);
    return users;
  },
}));
