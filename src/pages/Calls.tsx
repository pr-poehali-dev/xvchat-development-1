import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const callHistory = [
  { id: 1, name: "Алиса Кова", type: "video", direction: "in", time: "14:32", duration: "12:04", color: "from-purple-500 to-pink-500" },
  { id: 2, name: "Максим Рей", type: "audio", direction: "out", time: "13:10", duration: "5:32", color: "from-cyan-500 to-blue-500" },
  { id: 3, name: "Дарья Лим", type: "video", direction: "missed", time: "10:45", duration: "", color: "from-green-500 to-teal-500" },
  { id: 4, name: "Команда Dev", type: "audio", direction: "in", time: "Вчера", duration: "45:12", color: "from-orange-500 to-red-500" },
  { id: 5, name: "Игорь Волк", type: "video", direction: "out", time: "Вчера", duration: "2:15", color: "from-yellow-500 to-orange-500" },
];

export default function Calls() {
  const navigate = useNavigate();
  const [calling, setCalling] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-[#0a0a10]">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-80 flex-shrink-0 flex flex-col border-r border-white/5 glass-card"
      >
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate("/chats")} className="p-1.5 rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-colors">
                <Icon name="ArrowLeft" size={16} />
              </button>
              <span className="font-display font-bold text-white">Звонки</span>
            </div>
          </div>
        </div>

        {/* Quick call */}
        <div className="p-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCalling(true)}
            className="w-full py-3 rounded-xl gradient-bg text-white text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Icon name="Video" size={16} />
            Новый видеозвонок
          </motion.button>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden">
          <p className="px-4 py-2 text-xs font-semibold text-white/25 uppercase tracking-wider">История</p>
          {callHistory.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/4 transition-colors group"
            >
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                {c.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{c.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Icon
                    name={c.direction === "missed" ? "PhoneMissed" : c.direction === "in" ? "PhoneIncoming" : "PhoneOutgoing"}
                    size={12}
                    className={c.direction === "missed" ? "text-red-400" : "text-green-400"}
                  />
                  <span className="text-xs text-white/35">
                    {c.type === "video" ? "Видео" : "Аудио"} · {c.time}
                    {c.duration && ` · ${c.duration}`}
                  </span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={() => setCalling(true)}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-white/8 text-white/40 hover:text-cyan-400 transition-all"
              >
                <Icon name={c.type === "video" ? "Video" : "Phone"} size={14} />
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Bottom nav */}
        <div className="p-3 border-t border-white/5 flex justify-around">
          {[
            { icon: "MessageCircle", label: "Чаты", path: "/chats" },
            { icon: "Phone", label: "Звонки", path: "/calls", active: true },
            { icon: "User", label: "Профиль", path: "/profile" },
            { icon: "Settings", label: "Настройки", path: "/settings" },
          ].map(item => (
            <motion.button key={item.label} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl ${item.active ? "text-purple-400" : "text-white/30 hover:text-white/60"}`}>
              <Icon name={item.icon} size={18} />
              <span className="text-[10px]">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Main Area */}
      <div className="flex-1 relative flex items-center justify-center">
        <AnimatePresence>
          {!calling ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-6"
            >
              <div className="absolute inset-0 mesh-bg" />
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 w-24 h-24 rounded-full gradient-bg flex items-center justify-center mx-auto neon-glow"
              >
                <Icon name="Video" size={40} className="text-white" />
              </motion.div>
              <div className="relative z-10">
                <h2 className="font-display text-2xl font-black text-white mb-2">Начните звонок</h2>
                <p className="text-white/35 text-sm max-w-xs mx-auto">Выберите контакт из истории или начните новый видеозвонок WebRTC</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCalling(true)}
                className="relative z-10 px-8 py-3 rounded-xl gradient-bg text-white font-semibold text-sm"
              >
                Позвонить
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="calling"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full h-full relative flex flex-col"
            >
              {/* Video BG */}
              <div className="flex-1 relative bg-gradient-to-br from-purple-900/40 to-cyan-900/20 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  {camOff ? (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-5xl font-black">
                      А
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 text-white text-5xl font-black neon-glow">А</div>
                      <div className="text-white/50 text-sm">Видео недоступно в демо</div>
                    </div>
                  )}
                </div>

                {/* Self preview */}
                <motion.div
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  className="absolute top-4 right-4 w-32 h-24 rounded-xl glass-card border border-white/10 flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden"
                >
                  <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold">Я</div>
                </motion.div>

                {/* Call info */}
                <div className="absolute top-4 left-4 text-white">
                  <div className="font-display font-bold text-lg">Алиса Кова</div>
                  <div className="text-white/50 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    00:42
                  </div>
                </div>
              </div>

              {/* Controls */}
              <motion.div
                initial={{ y: 40 }}
                animate={{ y: 0 }}
                className="p-6 glass-card border-t border-white/5 flex items-center justify-center gap-4"
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMuted(!muted)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${muted ? "gradient-bg" : "bg-white/10 hover:bg-white/15"}`}
                >
                  <Icon name={muted ? "MicOff" : "Mic"} size={20} className="text-white" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCamOff(!camOff)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${camOff ? "gradient-bg" : "bg-white/10 hover:bg-white/15"}`}
                >
                  <Icon name={camOff ? "VideoOff" : "Video"} size={20} className="text-white" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCalling(false)}
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 transition-colors"
                >
                  <Icon name="PhoneOff" size={24} className="text-white" />
                </motion.button>

                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center">
                  <Icon name="MonitorUp" size={20} className="text-white" />
                </motion.button>

                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center">
                  <Icon name="MessageCircle" size={20} className="text-white" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
