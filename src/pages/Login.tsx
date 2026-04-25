import { useState } from "react";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/8f2a6ee9-4123-4dbd-b737-9eba2c9ec797";

interface Props {
  onLogin: (username: string) => void;
}

export default function Login({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        onLogin(data.username);
      } else {
        setError(data.error || "Ошибка входа");
      }
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid-bg font-rubik flex items-center justify-center">
      <div className="w-full max-w-sm mx-4">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-[hsla(180,100%,50%,0.1)] border border-[hsla(180,100%,50%,0.4)] flex items-center justify-center mb-4">
            <Icon name="Shield" size={28} className="neon-text-cyan" />
          </div>
          <div className="font-oswald text-xl font-bold neon-text-cyan tracking-widest uppercase">AHK Panel</div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Admin System</div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[hsl(220,22%,7%)] border border-border rounded-xl p-6 space-y-4"
        >
          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-widest mb-2">
              Логин
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-400/60 transition-colors"
              placeholder="Введите логин"
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground uppercase tracking-widest mb-2">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground outline-none focus:border-cyan-400/60 transition-colors"
              placeholder="Введите пароль"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <Icon name="AlertCircle" size={14} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-cyan-400/10 border border-cyan-400/40 text-cyan-400 text-sm font-semibold uppercase tracking-widest hover:bg-cyan-400/20 hover:border-cyan-400/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
