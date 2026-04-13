import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuthStore } from "@/store/authStore";

const steps = ["Аккаунт", "Профиль", "Готово"];

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser, loading } = useAuthStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (step === 0) {
      if (!name || name.trim().length < 2) { setError("Имя должно быть минимум 2 символа"); return; }
      if (!emailOrPhone) { setError("Укажите email или телефон"); return; }
      if (password.length < 8) { setError("Пароль минимум 8 символов"); return; }
      try {
        await registerUser(name.trim(), emailOrPhone.trim(), password);
        setStep(1);
        setTimeout(() => setStep(2), 800);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка регистрации");
      }
    } else if (step === 1) {
      setStep(2);
    } else {
      navigate("/chats");
    }
  };

  const strengthScore = Math.min(4, Math.floor(password.length / 3));

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full bg-pink-600/20 blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl animate-pulse-slow pointer-events-none" style={{ animationDelay: "1.5s" }} />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl gradient-bg items-center justify-center mb-4 neon-glow">
            <Icon name="Zap" size={24} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-black text-white mb-1">Создать аккаунт</h1>
          <p className="text-white/40 text-sm">Присоединяйся к xvChat бесплатно</p>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-300 ${i <= step ? "gradient-bg text-white" : "bg-white/10 text-white/30"}`}>
                {i < step ? <Icon name="Check" size={12} /> : i + 1}
              </div>
              <span className={`text-xs font-medium transition-colors ${i <= step ? "text-white/70" : "text-white/25"}`}>{s}</span>
              {i < steps.length - 1 && <div className={`flex-1 h-px transition-all duration-500 ${i < step ? "bg-purple-500/60" : "bg-white/10"}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleNext} className="glass-card rounded-3xl p-8">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-red-500/15 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">
                {error}
              </motion.div>
            )}

            {step === 0 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Имя</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Твоё имя" required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/60 transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Email или телефон</label>
                  <div className="relative">
                    <Icon name="Mail" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input type="text" value={emailOrPhone} onChange={e => setEmailOrPhone(e.target.value)} placeholder="you@example.com или +79991234567" required
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/60 transition-all text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Пароль</label>
                  <div className="relative">
                    <Icon name="Lock" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Минимум 8 символов" required
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/60 transition-all text-sm" />
                  </div>
                  <div className="flex gap-1 mt-2">
                    {[0,1,2,3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strengthScore ? "gradient-bg" : "bg-white/10"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-white/25 mt-1">Надёжность пароля</p>
                </div>
              </>
            )}

            {step === 1 && (
              <div className="text-center py-4 space-y-3">
                <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 1 }}
                  className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto neon-glow">
                  <Icon name="Loader" size={28} className="text-white animate-spin" />
                </motion.div>
                <p className="text-white/50 text-sm">Создаём аккаунт...</p>
              </div>
            )}

            {step === 2 && (
              <div className="text-center py-6 space-y-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center mx-auto neon-glow">
                  <Icon name="Check" size={36} className="text-white" />
                </motion.div>
                <h2 className="font-display text-2xl font-black text-white">Готово!</h2>
                <p className="text-white/45 text-sm">Добро пожаловать в xvChat, {name}!</p>
              </div>
            )}
          </motion.div>

          {step !== 1 && (
            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="w-full py-3.5 rounded-xl gradient-bg text-white font-bold text-sm mt-6 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><Icon name="Loader" size={16} className="animate-spin" /> Загрузка...</> : step === 2 ? "Начать общение" : "Продолжить"}
            </motion.button>
          )}

          {step === 0 && (
            <p className="text-center text-sm text-white/35 mt-4">
              Уже есть аккаунт?{" "}
              <button type="button" onClick={() => navigate("/login")} className="text-purple-400 hover:text-purple-300 font-medium">Войти</button>
            </p>
          )}
        </form>
      </motion.div>
    </div>
  );
}
