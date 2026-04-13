import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const contacts = [
  { id: 1, name: "Алиса Кова", username: "@alisa", msg: "Окей, до завтра 👋", time: "14:32", unread: 2, online: true, color: "from-purple-500 to-pink-500" },
  { id: 2, name: "Максим Рей", username: "@maxrey", msg: "Звонить сейчас?", time: "13:10", unread: 0, online: true, color: "from-cyan-500 to-blue-500" },
  { id: 3, name: "Команда Dev", username: "группа", msg: "Деплой прошёл успешно 🚀", time: "12:00", unread: 5, online: false, color: "from-orange-500 to-red-500" },
  { id: 4, name: "Дарья Лим", username: "@dasha", msg: "🎤 Голосовое сообщение", time: "10:45", unread: 0, online: false, color: "from-green-500 to-teal-500" },
  { id: 5, name: "Игорь Волк", username: "@igor", msg: "Фото", time: "Вчера", unread: 0, online: false, color: "from-yellow-500 to-orange-500" },
];

const msgs = [
  { id: 1, out: false, text: "Привет! Как дела с проектом?", time: "13:01" },
  { id: 2, out: true, text: "Отлично! Почти всё готово, деплоим завтра 🚀", time: "13:02" },
  { id: 3, out: false, text: "Круто! Надо обсудить детали. Можешь позвонить?", time: "13:05" },
  { id: 4, out: true, text: "Конечно, через 5 минут", time: "13:06" },
  { id: 5, out: false, text: "Звонить сейчас?", time: "13:10" },
];

export default function Chats() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState(2);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const active = contacts.find(c => c.id === activeId)!;

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.msg.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen flex overflow-hidden bg-[#0a0a10]">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-80 flex-shrink-0 flex flex-col border-r border-white/5 glass-card"
      >
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
          {/* Search */}
          <div className="relative">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск чатов..."
              className="w-full bg-white/5 border border-white/8 rounded-xl pl-8 pr-3 py-2.5 text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/40 text-sm transition-all"
            />
          </div>
        </div>

        {/* New Chat Button */}
        <div className="px-4 py-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Icon name="Plus" size={14} />
            Новый чат
          </motion.button>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden">
          {filtered.map(c => (
            <motion.button
              key={c.id}
              whileHover={{ x: 2 }}
              onClick={() => setActiveId(c.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${activeId === c.id ? "bg-white/8 border-r-2 border-purple-500" : "hover:bg-white/4"}`}
            >
              <div className="relative flex-shrink-0">
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white font-bold text-sm`}>
                  {c.name[0]}
                </div>
                {c.online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0a0a10]" />}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white truncate">{c.name}</span>
                  <span className="text-xs text-white/30 flex-shrink-0">{c.time}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-white/35 truncate">{c.msg}</span>
                  {c.unread > 0 && (
                    <span className="ml-2 flex-shrink-0 w-5 h-5 rounded-full gradient-bg text-white text-xs flex items-center justify-center font-bold">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Nav Bottom */}
        <div className="p-3 border-t border-white/5 flex justify-around">
          {[
            { icon: "MessageCircle", label: "Чаты", path: "/chats", active: true },
            { icon: "Phone", label: "Звонки", path: "/calls" },
            { icon: "Image", label: "Медиа", path: "/chats" },
            { icon: "User", label: "Профиль", path: "/profile" },
          ].map(item => (
            <motion.button
              key={item.label}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${item.active ? "text-purple-400" : "text-white/30 hover:text-white/60"}`}
            >
              <Icon name={item.icon} size={18} />
              <span className="text-[10px]">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between px-6 py-4 border-b border-white/5 glass-card"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${active.color} flex items-center justify-center text-white font-bold`}>
              {active.name[0]}
            </div>
            <div>
              <div className="font-semibold text-white text-sm">{active.name}</div>
              <div className="text-xs text-white/35 flex items-center gap-1">
                {active.online ? (
                  <><span className="w-1.5 h-1.5 bg-green-400 rounded-full" />В сети</>
                ) : (
                  "Не в сети"
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => navigate("/calls")} className="p-2.5 rounded-xl glass-card hover:border-purple-500/30 text-white/50 hover:text-white transition-colors">
              <Icon name="Phone" size={16} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => navigate("/calls")} className="p-2.5 rounded-xl glass-card hover:border-cyan-500/30 text-white/50 hover:text-white transition-colors">
              <Icon name="Video" size={16} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} className="p-2.5 rounded-xl glass-card text-white/50 hover:text-white transition-colors">
              <Icon name="Search" size={16} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} className="p-2.5 rounded-xl glass-card text-white/50 hover:text-white transition-colors">
              <Icon name="MoreVertical" size={16} />
            </motion.button>
          </div>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden p-6 space-y-3">
          <AnimatePresence>
            {msgs.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className={`flex ${m.out ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2.5 rounded-2xl ${m.out ? "msg-bubble-out rounded-br-sm" : "msg-bubble-in rounded-bl-sm"}`}>
                  <p className="text-white text-sm leading-relaxed">{m.text}</p>
                  <div className={`flex items-center gap-1 mt-1 ${m.out ? "justify-end" : "justify-start"}`}>
                    <span className="text-xs text-white/30">{m.time}</span>
                    {m.out && <Icon name="CheckCheck" size={12} className="text-cyan-400" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="msg-bubble-in rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-typing" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Input Area */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="p-4 border-t border-white/5 glass-card"
        >
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.1 }} className="p-2.5 rounded-xl text-white/40 hover:text-purple-400 transition-colors">
              <Icon name="Paperclip" size={18} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} className="p-2.5 rounded-xl text-white/40 hover:text-pink-400 transition-colors">
              <Icon name="Image" size={18} />
            </motion.button>
            <div className="flex-1 relative">
              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Написать сообщение..."
                className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/40 text-sm transition-all"
                onKeyDown={e => e.key === "Enter" && setMessage("")}
              />
            </div>
            <motion.button whileHover={{ scale: 1.1 }} className="p-2.5 rounded-xl text-white/40 hover:text-cyan-400 transition-colors">
              <Icon name="Mic" size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setMessage("")}
              className="p-2.5 rounded-xl gradient-bg text-white"
            >
              <Icon name="Send" size={18} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
