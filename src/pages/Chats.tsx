import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";

const COLORS = [
  "from-purple-500 to-pink-500",
  "from-cyan-500 to-blue-500",
  "from-orange-500 to-red-500",
  "from-green-500 to-teal-500",
  "from-yellow-500 to-orange-500",
];

function getColor(id: string) {
  let hash = 0;
  for (const c of id) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("ru", { day: "numeric", month: "short" });
}

export default function Chats() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { chats, activeChatId, messages, loadingChats, loadingMessages, loadChats, selectChat, sendMessage } = useChatStore();
  const [msgText, setMsgText] = useState("");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; avatar: string | null; status: string; custom_id: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { searchUsers, createChat } = useChatStore();

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadChats();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChatId]);

  const activeChat = chats.find(c => c.id === activeChatId);
  const chatMessages = activeChatId ? (messages[activeChatId] || []) : [];
  const filteredChats = chats.filter(c => {
    const name = c.is_group ? c.group_name : c.other_user?.name;
    return (name || "").toLowerCase().includes(search.toLowerCase());
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim() || !activeChatId) return;
    const text = msgText;
    setMsgText("");
    await sendMessage(activeChatId, text);
  };

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const users = await searchUsers(q);
      setSearchResults(users);
    } finally {
      setSearching(false);
    }
  };

  const handleStartChat = async (userId: string) => {
    const chatId = await createChat(userId);
    setShowSearch(false);
    setSearch("");
    setSearchResults([]);
    await selectChat(chatId);
  };

  const getChatName = (chat: typeof chats[0]) => chat.is_group ? (chat.group_name || "Группа") : (chat.other_user?.name || "Чат");
  const getChatStatus = (chat: typeof chats[0]) => chat.is_group ? "" : (chat.other_user?.status === "online" ? "В сети" : "Не в сети");

  return (
    <div className="h-screen flex overflow-hidden bg-[#0a0a10]">
      {/* Sidebar */}
      <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4 }}
        className="w-80 flex-shrink-0 flex flex-col border-r border-white/5 glass-card">
        
        {/* Header */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center">
                <Icon name="Zap" size={13} className="text-white" />
              </div>
              <span className="font-display font-bold text-white">xvChat</span>
            </div>
            <div className="flex items-center gap-1">
              <motion.button whileHover={{ scale: 1.1 }} onClick={() => navigate("/profile")} className="p-2 rounded-xl hover:bg-white/8 text-white/40 hover:text-white transition-colors">
                <Icon name="User" size={16} />
              </motion.button>
              <motion.button whileHover={{ scale: 1.1 }} onClick={() => navigate("/settings")} className="p-2 rounded-xl hover:bg-white/8 text-white/40 hover:text-white transition-colors">
                <Icon name="Settings" size={16} />
              </motion.button>
            </div>
          </div>

          {/* User info */}
          {user && (
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getColor(user.id)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {user.name[0]}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">{user.name}</div>
                <div className="text-xs text-white/30">{user.custom_id}</div>
              </div>
              <span className="ml-auto flex-shrink-0 w-2 h-2 bg-green-400 rounded-full" />
            </div>
          )}

          <div className="relative">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input value={showSearch ? search : search} onChange={e => showSearch ? handleSearch(e.target.value) : setSearch(e.target.value)}
              onFocus={() => setShowSearch(true)}
              placeholder={showSearch ? "Найти пользователей..." : "Поиск чатов..."}
              className="w-full bg-white/5 border border-white/8 rounded-xl pl-8 pr-3 py-2.5 text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/40 text-sm transition-all" />
            {showSearch && (
              <button onClick={() => { setShowSearch(false); setSearch(""); setSearchResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                <Icon name="X" size={12} />
              </button>
            )}
          </div>
        </div>

        {/* New Chat Button */}
        <div className="px-4 py-3">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowSearch(true)}
            className="w-full py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold flex items-center justify-center gap-2">
            <Icon name="Plus" size={14} />
            Новый чат
          </motion.button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden">
          {/* Search results */}
          {showSearch && search.length >= 2 && (
            <div className="px-2 pb-2">
              <p className="text-xs text-white/25 px-2 py-1">Пользователи</p>
              {searching && <div className="text-center py-4 text-white/25 text-xs">Поиск...</div>}
              {!searching && searchResults.map(u => (
                <motion.button key={u.id} whileHover={{ x: 2 }} onClick={() => handleStartChat(u.id)}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/5 transition-all">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getColor(u.id)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 relative`}>
                    {u.name[0]}
                    {u.status === "online" && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0a0a10]" />}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white">{u.name}</div>
                    <div className="text-xs text-white/35">{u.custom_id}</div>
                  </div>
                </motion.button>
              ))}
              {!searching && searchResults.length === 0 && (
                <div className="text-center py-4 text-white/25 text-xs">Никого не найдено</div>
              )}
            </div>
          )}

          {/* Chat list */}
          {!showSearch && (
            loadingChats ? (
              <div className="flex items-center justify-center py-12 text-white/25 text-sm">
                <Icon name="Loader" size={20} className="animate-spin mr-2" /> Загрузка...
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center py-12 text-white/25 text-sm px-4">
                <Icon name="MessageCircle" size={32} className="mx-auto mb-3 opacity-30" />
                Нет чатов. Начните новый!
              </div>
            ) : (
              filteredChats.map(c => (
                <motion.button key={c.id} whileHover={{ x: 2 }} onClick={() => selectChat(c.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${activeChatId === c.id ? "bg-white/8 border-r-2 border-purple-500" : "hover:bg-white/4"}`}>
                  <div className="relative flex-shrink-0">
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getColor(c.id)} flex items-center justify-center text-white font-bold text-sm`}>
                      {getChatName(c)[0]}
                    </div>
                    {!c.is_group && c.other_user?.status === "online" && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0a0a10]" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white truncate">{getChatName(c)}</span>
                      {c.last_message?.at && <span className="text-xs text-white/30 flex-shrink-0">{formatTime(c.last_message.at)}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-white/35 truncate">{c.last_message?.content || getChatStatus(c) || "Нет сообщений"}</span>
                      {c.unread_count > 0 && (
                        <span className="ml-2 flex-shrink-0 w-5 h-5 rounded-full gradient-bg text-white text-xs flex items-center justify-center font-bold">
                          {c.unread_count > 9 ? "9+" : c.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))
            )
          )}
        </div>

        {/* Bottom nav */}
        <div className="p-3 border-t border-white/5 flex justify-around">
          {[
            { icon: "MessageCircle", label: "Чаты", path: "/chats", active: true },
            { icon: "Phone", label: "Звонки", path: "/calls" },
            { icon: "Users", label: "Контакты", path: "/contacts" },
            { icon: "User", label: "Профиль", path: "/profile" },
          ].map(item => (
            <motion.button key={item.label} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${item.active ? "text-purple-400" : "text-white/30 hover:text-white/60"}`}>
              <Icon name={item.icon} size={18} />
              <span className="text-[10px]">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeChatId ? (
          <div className="flex-1 flex items-center justify-center relative">
            <div className="absolute inset-0 mesh-bg" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 text-center space-y-4">
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center mx-auto neon-glow">
                <Icon name="MessageCircle" size={36} className="text-white" />
              </motion.div>
              <h2 className="font-display text-xl font-black text-white">Выберите чат</h2>
              <p className="text-white/35 text-sm">или начните новый разговор</p>
            </motion.div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}
              className="flex items-center justify-between px-6 py-4 border-b border-white/5 glass-card">
              <div className="flex items-center gap-3">
                {activeChat && (
                  <>
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getColor(activeChat.id)} flex items-center justify-center text-white font-bold`}>
                      {getChatName(activeChat)[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{getChatName(activeChat)}</div>
                      <div className="text-xs text-white/35 flex items-center gap-1">
                        {!activeChat.is_group && activeChat.other_user?.status === "online" ? (
                          <><span className="w-1.5 h-1.5 bg-green-400 rounded-full" />В сети</>
                        ) : "Не в сети"}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => navigate("/calls")}
                  className="p-2.5 rounded-xl glass-card hover:border-purple-500/30 text-white/50 hover:text-white transition-colors">
                  <Icon name="Phone" size={16} />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => navigate("/calls")}
                  className="p-2.5 rounded-xl glass-card hover:border-cyan-500/30 text-white/50 hover:text-white transition-colors">
                  <Icon name="Video" size={16} />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} onClick={loadChats}
                  className="p-2.5 rounded-xl glass-card text-white/50 hover:text-white transition-colors" title="Обновить">
                  <Icon name="RefreshCw" size={16} />
                </motion.button>
              </div>
            </motion.div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-hidden p-6 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-12 text-white/25">
                  <Icon name="Loader" size={24} className="animate-spin" />
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="text-center py-12 text-white/25 text-sm">Нет сообщений. Напишите первым!</div>
              ) : (
                <AnimatePresence>
                  {chatMessages.map((m, i) => {
                    const isMe = m.sender_id === user?.id || m.sender_id === "__me__";
                    return (
                      <motion.div key={m.id} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2.5 rounded-2xl ${isMe ? "msg-bubble-out rounded-br-sm" : "msg-bubble-in rounded-bl-sm"}`}>
                          {!isMe && <p className="text-xs text-purple-400 mb-1 font-medium">{m.sender.name}</p>}
                          <p className="text-white text-sm leading-relaxed">{m.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                            <span className="text-xs text-white/30">{formatTime(m.created_at)}</span>
                            {isMe && <Icon name={m.is_read ? "CheckCheck" : "Check"} size={12} className={m.is_read ? "text-cyan-400" : "text-white/30"} />}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}
              className="p-4 border-t border-white/5 glass-card">
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <motion.button type="button" whileHover={{ scale: 1.1 }} className="p-2.5 rounded-xl text-white/40 hover:text-purple-400 transition-colors">
                  <Icon name="Paperclip" size={18} />
                </motion.button>
                <div className="flex-1 relative">
                  <input value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="Написать сообщение..."
                    className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/40 text-sm transition-all" />
                </div>
                <motion.button type="button" whileHover={{ scale: 1.1 }} className="p-2.5 rounded-xl text-white/40 hover:text-cyan-400 transition-colors">
                  <Icon name="Mic" size={18} />
                </motion.button>
                <motion.button type="submit" disabled={!msgText.trim()} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  className="p-2.5 rounded-xl gradient-bg text-white disabled:opacity-40">
                  <Icon name="Send" size={18} />
                </motion.button>
              </form>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
