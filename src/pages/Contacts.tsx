import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const contacts = [
  { id: 1, name: "Алиса Кова", username: "@alisa", online: true, color: "from-purple-500 to-pink-500", mutual: 12 },
  { id: 2, name: "Максим Рей", username: "@maxrey", online: true, color: "from-cyan-500 to-blue-500", mutual: 5 },
  { id: 3, name: "Дарья Лим", username: "@dasha", online: false, color: "from-green-500 to-teal-500", mutual: 8 },
  { id: 4, name: "Игорь Волк", username: "@igor", online: false, color: "from-yellow-500 to-orange-500", mutual: 3 },
  { id: 5, name: "Команда Dev", username: "@devteam", online: true, color: "from-orange-500 to-red-500", mutual: 22 },
  { id: 6, name: "Светлана Нова", username: "@svetlana", online: false, color: "from-pink-500 to-rose-500", mutual: 1 },
  { id: 7, name: "Артём Бор", username: "@artem", online: true, color: "from-indigo-500 to-purple-500", mutual: 7 },
  { id: 8, name: "Кира Зимс", username: "@kira", online: false, color: "from-teal-500 to-cyan-500", mutual: 4 },
];

export default function Contacts() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "online">("all");

  const filtered = contacts.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.username.includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "online" && c.online);
    return matchSearch && matchFilter;
  });

  return (
    <div className="h-screen flex overflow-hidden bg-[#0a0a10]">
      {/* Sidebar nav */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-72 flex-shrink-0 flex flex-col border-r border-white/5 glass-card"
      >
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/chats")} className="p-1.5 rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-colors">
              <Icon name="ArrowLeft" size={16} />
            </button>
            <span className="font-display font-bold text-white">Контакты</span>
          </div>
          <div className="relative mt-4">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..." className="w-full bg-white/5 border border-white/8 rounded-xl pl-8 pr-3 py-2.5 text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/40 text-sm transition-all" />
          </div>
          <div className="flex gap-2 mt-3">
            {(["all", "online"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? "gradient-bg text-white" : "glass-card text-white/40 hover:text-white/60"}`}>
                {f === "all" ? `Все (${contacts.length})` : `Онлайн (${contacts.filter(c => c.online).length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hidden p-3 space-y-1">
          {filtered.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ x: 2 }}
              onClick={() => navigate("/chats")}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group"
            >
              <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white font-bold text-sm`}>
                  {c.name[0]}
                </div>
                {c.online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0a0a10]" />}
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-white">{c.name}</div>
                <div className="text-xs text-white/35">{c.username} · {c.mutual} общих</div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                <div className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-cyan-400 transition-colors">
                  <Icon name="MessageCircle" size={14} />
                </div>
                <div className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-purple-400 transition-colors">
                  <Icon name="Phone" size={14} />
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="p-4 border-t border-white/5">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="w-full py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold flex items-center justify-center gap-2">
            <Icon name="UserPlus" size={14} />
            Добавить контакт
          </motion.button>
        </div>
      </motion.div>

      {/* Contact detail */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="absolute inset-0 mesh-bg" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 text-center max-w-sm space-y-5"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center mx-auto neon-glow"
          >
            <Icon name="Users" size={36} className="text-white" />
          </motion.div>
          <div>
            <h2 className="font-display text-xl font-black text-white mb-2">Выберите контакт</h2>
            <p className="text-white/35 text-sm">Выберите из списка слева, чтобы начать общение или посмотреть профиль</p>
          </div>
          <div className="flex justify-center gap-3">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/chats")}
              className="px-5 py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold">
              Открыть чаты
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="px-5 py-2.5 rounded-xl glass-card text-white/60 hover:text-white text-sm font-semibold transition-colors">
              <Icon name="QrCode" size={16} className="inline mr-1" />
              QR-код
            </motion.button>
          </div>

          {/* Online count */}
          <div className="glass-card rounded-xl px-5 py-3 inline-flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white/50 text-sm">{contacts.filter(c => c.online).length} онлайн из {contacts.length}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
