import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const features = [
  { icon: "MessageCircle", title: "Умные чаты", desc: "Текст, медиа, реакции и групповые беседы в реальном времени" },
  { icon: "Video", title: "Звонки WebRTC", desc: "HD-видеозвонки без задержек с передовой технологией P2P" },
  { icon: "Mic", title: "Голосовые сообщения", desc: "Запись, воспроизведение и отправка голосовых сообщений одним касанием" },
  { icon: "Image", title: "Медиа-галерея", desc: "Фото, видео, файлы — всё хранится и доступно мгновенно" },
  { icon: "Shield", title: "End-to-End шифрование", desc: "Ваши переписки защищены военным уровнем шифрования" },
  { icon: "Zap", title: "Мгновенная доставка", desc: "Сообщения приходят за миллисекунды в любую точку мира" },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
};

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen mesh-bg overflow-x-hidden">
      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 glass-card border-b border-white/5"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <Icon name="Zap" size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl text-white">xvChat</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="px-5 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Войти
          </button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/register")}
            className="px-5 py-2 text-sm font-semibold text-white rounded-full gradient-bg neon-glow"
          >
            Начать бесплатно
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-6">
        {/* Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl animate-pulse-slow pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-pink-500/10 blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: "0.8s" }} />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="text-center max-w-4xl relative z-10"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-2 mb-8 text-sm text-white/60">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Онлайн 12 847 пользователей
          </motion.div>

          <motion.h1 variants={fadeUp} className="font-display text-6xl md:text-8xl font-black leading-none mb-6">
            <span className="text-white">Общайся</span>
            <br />
            <span className="gradient-text">без границ</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-xl text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed">
            xvChat — мессенджер нового поколения с WebRTC звонками, голосовыми сообщениями и end-to-end шифрованием. Быстро. Красиво. Безопасно.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(168,85,247,0.5)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/register")}
              className="px-10 py-4 text-lg font-bold text-white rounded-2xl gradient-bg"
            >
              Создать аккаунт
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/login")}
              className="px-10 py-4 text-lg font-semibold text-white rounded-2xl glass-card hover:border-purple-500/40 transition-colors"
            >
              Войти
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div variants={fadeUp} className="flex justify-center gap-12 mt-16">
            {[
              { num: "2M+", label: "Пользователей" },
              { num: "99.9%", label: "Uptime" },
              { num: "< 50ms", label: "Задержка" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="font-display text-3xl font-black gradient-text">{s.num}</div>
                <div className="text-sm text-white/40 mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-32 px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-black text-white mb-4">
            Всё, что нужно для <span className="gradient-text">живого общения</span>
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">Создан с любовью к деталям и скоростью в крови</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="glass-card rounded-2xl p-6 cursor-default group"
            >
              <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon name={f.icon} fallback="Star" size={22} className="text-white" />
              </div>
              <h3 className="font-display font-bold text-white text-lg mb-2">{f.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center glass-card rounded-3xl p-16 relative overflow-hidden"
        >
          <div className="absolute inset-0 gradient-bg opacity-10" />
          <h2 className="font-display text-4xl font-black text-white mb-4 relative z-10">
            Готов начать?
          </h2>
          <p className="text-white/50 mb-8 relative z-10">Присоединяйся к миллионам пользователей. Бесплатно навсегда.</p>
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => navigate("/register")}
            className="px-12 py-4 text-lg font-bold text-white rounded-2xl gradient-bg neon-glow relative z-10"
          >
            Зарегистрироваться
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5 text-center text-white/25 text-sm">
        © 2026 xvChat · Все права защищены
      </footer>
    </div>
  );
}