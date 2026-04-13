import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuthStore } from "@/store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(loginValue.trim(), password);
      navigate("/chats");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-0 right-1/3 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: "1s" }} />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex w-16 h-16 rounded-2xl gradient-bg items-center justify-center mb-4 neon-glow"
          >
            <Icon name="Zap" size={28} className="text-white" />
          </motion.div>
          <h1 className="font-display text-3xl font-black text-white mb-1">Добро пожаловать</h1>
          <p className="text-white/40 text-sm">Войдите в свой аккаунт xvChat</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-8 space-y-5">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/15 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Email или телефон</label>
            <div className="relative">
              <Icon name="Mail" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={loginValue}
                onChange={e => setLoginValue(e.target.value)}
                placeholder="you@example.com или +79991234567"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/60 focus:bg-white/8 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Пароль</label>
            <div className="relative">
              <Icon name="Lock" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/60 transition-all text-sm"
              />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                <Icon name={show ? "EyeOff" : "Eye"} size={16} />
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02, boxShadow: "0 0 30px rgba(168,85,247,0.5)" }}
            whileTap={{ scale: loading ? 1 : 0.97 }}
            className="w-full py-3.5 rounded-xl gradient-bg text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Icon name="Loader" size={16} className="animate-spin" /> Входим...</>
            ) : "Войти в аккаунт"}
          </motion.button>

          <p className="text-center text-sm text-white/35">
            Нет аккаунта?{" "}
            <button type="button" onClick={() => navigate("/register")} className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Зарегистрироваться
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
