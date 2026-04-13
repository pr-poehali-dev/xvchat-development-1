import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const stats = [
  { label: "Сообщений", value: "4,821" },
  { label: "Друзей", value: "142" },
  { label: "Звонков", value: "89" },
];

const mediaItems = [
  { id: 1, type: "image", color: "from-purple-500 to-pink-500" },
  { id: 2, type: "image", color: "from-cyan-500 to-blue-500" },
  { id: 3, type: "image", color: "from-orange-500 to-red-500" },
  { id: 4, type: "image", color: "from-green-500 to-teal-500" },
  { id: 5, type: "image", color: "from-yellow-500 to-orange-500" },
  { id: 6, type: "image", color: "from-pink-500 to-purple-500" },
];

const tabs = ["Медиа", "Файлы", "Ссылки"];

export default function Profile() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("Разработчик · Путешественник · Меломан 🎵");

  return (
    <div className="min-h-screen mesh-bg overflow-y-auto scrollbar-hidden">
      <div className="max-w-2xl mx-auto px-4 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between py-5"
        >
          <button onClick={() => navigate("/chats")} className="p-2 rounded-xl glass-card text-white/50 hover:text-white transition-colors">
            <Icon name="ArrowLeft" size={18} />
          </button>
          <span className="font-display font-bold text-white">Профиль</span>
          <button onClick={() => navigate("/settings")} className="p-2 rounded-xl glass-card text-white/50 hover:text-white transition-colors">
            <Icon name="Settings" size={18} />
          </button>
        </motion.div>

        {/* Avatar + Info */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center py-8"
        >
          <div className="relative mb-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 flex items-center justify-center text-white text-4xl font-black neon-glow cursor-pointer"
            >
              М
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              className="absolute bottom-1 right-1 w-8 h-8 rounded-full gradient-bg flex items-center justify-center border-2 border-[#0a0a10]"
            >
              <Icon name="Camera" size={12} className="text-white" />
            </motion.button>
            <span className="absolute top-1 right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-[#0a0a10]" />
          </div>

          <h1 className="font-display text-2xl font-black text-white mb-1">Максим Рейнольдс</h1>
          <p className="text-white/40 text-sm mb-3">@maxrey · #4821</p>

          {editing ? (
            <div className="w-full max-w-xs">
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full bg-white/5 border border-purple-500/40 rounded-xl px-4 py-2 text-white text-sm resize-none focus:outline-none"
                rows={2}
              />
              <div className="flex gap-2 mt-2 justify-center">
                <button onClick={() => setEditing(false)} className="px-4 py-1.5 rounded-lg gradient-bg text-white text-xs font-semibold">Сохранить</button>
                <button onClick={() => setEditing(false)} className="px-4 py-1.5 rounded-lg glass-card text-white/60 text-xs">Отмена</button>
              </div>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => setEditing(true)}
              className="text-white/50 text-sm hover:text-white/80 transition-colors flex items-center gap-1.5 group"
            >
              {bio}
              <Icon name="Pencil" size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 mt-6">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/chats")}
              className="px-6 py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold flex items-center gap-2">
              <Icon name="MessageCircle" size={14} />
              Написать
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/calls")}
              className="px-6 py-2.5 rounded-xl glass-card text-white/70 hover:text-white text-sm font-semibold flex items-center gap-2 transition-colors">
              <Icon name="Phone" size={14} />
              Позвонить
            </motion.button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              whileHover={{ scale: 1.04, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="glass-card rounded-2xl p-4 text-center"
            >
              <div className="font-display text-xl font-black gradient-text">{s.value}</div>
              <div className="text-xs text-white/35 mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-5 mb-6 space-y-4"
        >
          {[
            { icon: "Mail", label: "Email", value: "max@example.com" },
            { icon: "Phone", label: "Телефон", value: "+7 (999) 123-45-67" },
            { icon: "MapPin", label: "Город", value: "Москва, Россия" },
            { icon: "Calendar", label: "Дата рождения", value: "12 марта 1995" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <Icon name={item.icon} size={14} className="text-purple-400" />
              </div>
              <div>
                <div className="text-xs text-white/30">{item.label}</div>
                <div className="text-sm text-white font-medium">{item.value}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Media Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex gap-1 mb-4 glass-card rounded-xl p-1">
            {tabs.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === i ? "gradient-bg text-white" : "text-white/40 hover:text-white/60"}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {mediaItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.06 }}
                whileHover={{ scale: 1.04, zIndex: 10 }}
                className={`aspect-square rounded-xl bg-gradient-to-br ${item.color} cursor-pointer relative overflow-hidden`}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <Icon name="Image" size={24} className="text-white" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
