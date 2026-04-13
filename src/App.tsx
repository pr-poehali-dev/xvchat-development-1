import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chats from "./pages/Chats";
import Calls from "./pages/Calls";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Contacts from "./pages/Contacts";
import NotFound from "./pages/NotFound";
import { useAuthStore } from "./store/authStore";

const queryClient = new QueryClient();

function AppRoutes() {
  const { hydrate, initialized, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (initialized && user) {
      const path = window.location.pathname;
      if (path === "/" || path === "/login" || path === "/register") {
        navigate("/chats");
      }
    }
  }, [initialized, user]);

  if (!initialized) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center neon-glow animate-pulse-slow">
          <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/chats" element={<Chats />} />
      <Route path="/calls" element={<Calls />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/contacts" element={<Contacts />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;