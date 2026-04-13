import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

type Section = "account" | "notifications" | "privacy" | "appearance" | "calls" | "about";

const menu: { id: Section; icon: string; label: string; desc: string }[] = [
  { id: "account", icon: "User", label: "Аккаунт", desc: "Профиль, email, пароль" },
  { id: "notifications", icon: "Bell", label: "Уведомления", desc: "Звуки, вибрация, показ" },
  { id: "privacy", icon: "Shield", label: "Приватность", desc: "Кто видит ваш статус" },
  { id: "appearance", icon: "Palette", label: "Оформление", desc: "Тема, цвета, шрифты" },
  { id: "calls", icon: "Phone", label: "Звонки", desc: "Качество, устройства, WebRTC" },
  { id: "about", icon: "Info", label: "О приложении", desc: "Версия, обновления" },
];

export default function Settings() {
  const navigate = useNavigate();
  const [active, setActive] = useState<Section>("account");
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifCalls, setNotifCalls] = useState(true);
  const [notifSounds, setNotifSounds] = useState(false);
  const [privOnline, setPrivOnline] = useState(true);
  const [privRead, setPrivRead] = useState(true);
  const [theme, setTheme] = useState("dark");

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <motion.button
      onClick={onChange}
      className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${value ? "gradient-bg" : "bg-white/10"}`}
    >
      <motion.div
        animate={{ x: value ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
      />
    </motion.button>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-[#0a0a10]">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-72 flex-shrink-0 flex flex-col border-r border-white/5 glass-card"
      >
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => navigate("/chats")} className="p-1.5 rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-colors">
              <Icon name="ArrowLeft" size={16} />
            </button>
            <span className="font-display font-bold text-white">Настройки</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hidden p-3 space-y-1">
          {menu.map((item, i) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ x: 2 }}
              onClick={() => setActive(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${active === item.id ? "bg-white/8 border border-purple-500/30" : "hover:bg-white/4"}`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${active === item.id ? "gradient-bg" : "bg-white/5"}`}>
                <Icon name={item.icon} size={16} className={active === item.id ? "text-white" : "text-white/50"} />
              </div>
              <div>
                <div className={`text-sm font-semibold ${active === item.id ? "text-white" : "text-white/70"}`}>{item.label}</div>
                <div className="text-xs text-white/30">{item.desc}</div>
              </div>
              {active === item.id && <Icon name="ChevronRight" size={14} className="ml-auto text-purple-400" />}
            </motion.button>
          ))}
        </div>

        <div className="p-4 border-t border-white/5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/")}
            className="w-full py-2.5 rounded-xl glass-card border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Icon name="LogOut" size={14} />
            Выйти из аккаунта
          </motion.button>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden p-8">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-xl"
        >
          {active === "account" && (
            <>
              <h2 className="font-display text-2xl font-black text-white mb-6">Аккаунт</h2>
              <div className="glass-card rounded-2xl p-6 space-y-5">
                {[
                  { label: "Имя", value: "Максим Рейнольдс", type: "text" },
                  { label: "Username", value: "@maxrey", type: "text" },
                  { label: "Email", value: "max@example.com", type: "email" },
                  { label: "Телефон", value: "+7 (999) 123-45-67", type: "tel" },
                ].map(field => (
                  <div key={field.label}>
                    <label className="block text-sm font-medium text-white/50 mb-1.5">{field.label}</label>
                    <input type={field.type} defaultValue={field.value}
                      className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all" />
                  </div>
                ))}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="w-full py-3 rounded-xl gradient-bg text-white font-semibold text-sm">
                  Сохранить изменения
                </motion.button>
              </div>
            </>
          )}

          {active === "notifications" && (
            <>
              <h2 className="font-display text-2xl font-black text-white mb-6">Уведомления</h2>
              <div className="glass-card rounded-2xl overflow-hidden">
                {[
                  { label: "Сообщения", desc: "Уведомления о новых сообщениях", value: notifMessages, onChange: () => setNotifMessages(!notifMessages) },
                  { label: "Звонки", desc: "Входящие звонки", value: notifCalls, onChange: () => setNotifCalls(!notifCalls) },
                  { label: "Звуки", desc: "Звуки уведомлений", value: notifSounds, onChange: () => setNotifSounds(!notifSounds) },
                ].map((item, i) => (
                  <div key={item.label} className={`flex items-center justify-between p-5 ${i > 0 ? "border-t border-white/5" : ""}`}>
                    <div>
                      <div className="text-sm font-semibold text-white">{item.label}</div>
                      <div className="text-xs text-white/35 mt-0.5">{item.desc}</div>
                    </div>
                    <Toggle value={item.value} onChange={item.onChange} />
                  </div>
                ))}
              </div>
            </>
          )}

          {active === "privacy" && (
            <>
              <h2 className="font-display text-2xl font-black text-white mb-6">Приватность</h2>
              <div className="glass-card rounded-2xl overflow-hidden">
                {[
                  { label: "Статус «В сети»", desc: "Показывать, когда вы онлайн", value: privOnline, onChange: () => setPrivOnline(!privOnline) },
                  { label: "Прочитано", desc: "Показывать двойные галочки", value: privRead, onChange: () => setPrivRead(!privRead) },
                ].map((item, i) => (
                  <div key={item.label} className={`flex items-center justify-between p-5 ${i > 0 ? "border-t border-white/5" : ""}`}>
                    <div>
                      <div className="text-sm font-semibold text-white">{item.label}</div>
                      <div className="text-xs text-white/35 mt-0.5">{item.desc}</div>
                    </div>
                    <Toggle value={item.value} onChange={item.onChange} />
                  </div>
                ))}
              </div>
            </>
          )}

          {active === "appearance" && (
            <>
              <h2 className="font-display text-2xl font-black text-white mb-6">Оформление</h2>
              <div className="glass-card rounded-2xl p-5 space-y-5">
                <div>
                  <p className="text-sm font-semibold text-white mb-3">Тема</p>
                  <div className="grid grid-cols-3 gap-3">
                    {["dark", "darker", "light"].map(t => (
                      <motion.button key={t} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setTheme(t)}
                        className={`py-3 rounded-xl text-sm font-medium border transition-all ${theme === t ? "gradient-bg text-white border-purple-500/0" : "glass-card text-white/50 hover:text-white/70 border-white/5"}`}>
                        {t === "dark" ? "Тёмная" : t === "darker" ? "Чёрная" : "Светлая"}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-3">Акцентный цвет</p>
                  <div className="flex gap-3">
                    {[
                      "from-purple-500 to-pink-500",
                      "from-cyan-500 to-blue-500",
                      "from-green-500 to-teal-500",
                      "from-orange-500 to-red-500",
                      "from-yellow-500 to-orange-500",
                    ].map(c => (
                      <motion.button key={c} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${c} neon-glow`} />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {active === "calls" && (
            <>
              <h2 className="font-display text-2xl font-black text-white mb-6">Звонки</h2>
              <div className="glass-card rounded-2xl p-5 space-y-5">
                {[
                  { label: "Качество видео", options: ["HD 720p", "Full HD 1080p", "4K"] },
                  { label: "Шумоподавление", options: ["Выкл", "Слабое", "Сильное"] },
                ].map(item => (
                  <div key={item.label}>
                    <label className="block text-sm font-medium text-white/50 mb-2">{item.label}</label>
                    <div className="flex gap-2">
                      {item.options.map(o => (
                        <button key={o} className="px-3 py-1.5 rounded-lg glass-card text-sm text-white/60 hover:text-white hover:border-purple-500/30 transition-all border border-white/5">
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="text-xs text-white/25 pt-2">WebRTC P2P · ICE Servers настроены · STUN/TURN активны</div>
              </div>
            </>
          )}

          {active === "about" && (
            <>
              <h2 className="font-display text-2xl font-black text-white mb-6">О приложении</h2>
              <div className="glass-card rounded-2xl p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto neon-glow">
                  <Icon name="Zap" size={28} className="text-white" />
                </div>
                <div>
                  <div className="font-display text-xl font-black gradient-text">xvChat</div>
                  <div className="text-white/35 text-sm mt-1">Версия 1.0.0</div>
                </div>
                <div className="text-white/30 text-sm leading-relaxed max-w-xs mx-auto">
                  Мессенджер нового поколения с WebRTC звонками и end-to-end шифрованием
                </div>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="px-6 py-2.5 rounded-xl gradient-bg text-white text-sm font-semibold">
                  Проверить обновления
                </motion.button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
