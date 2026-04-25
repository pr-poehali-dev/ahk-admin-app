import { useState } from "react";
import Icon from "@/components/ui/icon";

type Section = "home" | "punishments" | "commands" | "settings";

interface Command {
  id: string;
  name: string;
  command: string;
  description: string;
  category: "ban" | "mute" | "kick" | "warn" | "other";
}

interface PunishmentTemplate {
  id: string;
  name: string;
  commandId: string;
  defaultDuration: string;
  color: "red" | "orange" | "cyan" | "purple";
}

interface PunishmentLog {
  id: string;
  player: string;
  static: string;
  duration: string;
  ticketNo: string;
  command: string;
  timestamp: string;
  admin: string;
}

const defaultCommands: Command[] = [
  { id: "1", name: "Бан", command: "ban", description: "Заблокировать игрока навсегда", category: "ban" },
  { id: "2", name: "Мут", command: "mute", description: "Замолчать игрока в чате", category: "mute" },
  { id: "3", name: "Кик", command: "kick", description: "Выгнать с сервера", category: "kick" },
  { id: "4", name: "Предупреждение", command: "warn", description: "Выдать предупреждение", category: "warn" },
  { id: "5", name: "Временный бан", command: "tempban", description: "Временная блокировка", category: "ban" },
];

const defaultTemplates: PunishmentTemplate[] = [
  { id: "1", name: "Читы", commandId: "1", defaultDuration: "permanent", color: "red" },
  { id: "2", name: "Флуд в чате", commandId: "2", defaultDuration: "30m", color: "orange" },
  { id: "3", name: "Токсик / Оскорбления", commandId: "4", defaultDuration: "", color: "cyan" },
  { id: "4", name: "AFK", commandId: "3", defaultDuration: "", color: "purple" },
];

const categoryColors: Record<string, string> = {
  ban: "tag-red",
  mute: "tag-orange",
  kick: "tag-cyan",
  warn: "tag-green",
  other: "tag-cyan",
};

const categoryLabels: Record<string, string> = {
  ban: "БАН",
  mute: "МУТ",
  kick: "КИК",
  warn: "ВАРН",
  other: "ПРОЧЕЕ",
};

const templateColorMap: Record<string, { border: string; tag: string }> = {
  red: { border: "border-red-500/40 hover:border-red-500/70 hover:bg-red-500/5", tag: "tag-red" },
  orange: { border: "border-orange-500/40 hover:border-orange-500/70 hover:bg-orange-500/5", tag: "tag-orange" },
  cyan: { border: "border-cyan-400/40 hover:border-cyan-400/70 hover:bg-cyan-400/5", tag: "tag-cyan" },
  purple: { border: "border-purple-500/40 hover:border-purple-500/70 hover:bg-purple-500/5", tag: "tag-cyan" },
};

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });
  const set = (v: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch (e) { /* ignore */ }
      return next;
    });
  };
  return [value, set] as const;
}

export default function Index() {
  const [section, setSection] = useState<Section>("home");
  const [commands, setCommands] = useLocalStorage<Command[]>("ahk_commands", defaultCommands);
  const [templates, setTemplates] = useLocalStorage<PunishmentTemplate[]>("ahk_templates", defaultTemplates);
  const [logs, setLogs] = useLocalStorage<PunishmentLog[]>("ahk_logs", []);
  const [adminName, setAdminName] = useLocalStorage<string>("ahk_admin", "Admin");
  const [serverName, setServerName] = useLocalStorage<string>("ahk_server", "Мой сервер");

  const [punishForm, setPunishForm] = useState({
    static: "",
    duration: "",
    ticketNo: "",
    commandId: "",
    reason: "",
  });
  const [generatedCommand, setGeneratedCommand] = useState("");
  const [copied, setCopied] = useState(false);
  const [autoInserted, setAutoInserted] = useState(false);

  const [newCmd, setNewCmd] = useState({ name: "", command: "", description: "", category: "ban" as Command["category"] });
  const [newTemplate, setNewTemplate] = useState({ name: "", commandId: "", defaultDuration: "", color: "cyan" as PunishmentTemplate["color"] });

  const [showAddCmd, setShowAddCmd] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);

  const getCommandById = (id: string) => commands.find((c) => c.id === id);

  const buildCommand = (form = punishForm) => {
    const cmd = getCommandById(form.commandId);
    if (!cmd || !form.static) return "";
    const parts = [`/${cmd.command}`, form.static];
    if (form.duration) parts.push(form.duration);
    if (form.reason) parts.push(form.reason);
    if (form.ticketNo) parts.push(`#${form.ticketNo}`);
    return parts.join(" ");
  };

  const handleGenerate = () => {
    const result = buildCommand();
    if (!result) return;
    setGeneratedCommand(result);
  };

  const handleAutoInsert = async () => {
    const cmd = generatedCommand || buildCommand();
    if (!cmd) return;
    try {
      await navigator.clipboard.writeText(cmd);
      setGeneratedCommand(cmd);
      setAutoInserted(true);
      setTimeout(() => setAutoInserted(false), 3000);
      if (punishForm.static) {
        const log: PunishmentLog = {
          id: Date.now().toString(),
          player: punishForm.static,
          static: punishForm.static,
          duration: punishForm.duration,
          ticketNo: punishForm.ticketNo,
          command: cmd,
          timestamp: new Date().toLocaleTimeString("ru-RU"),
          admin: adminName,
        };
        setLogs((prev) => [log, ...prev.slice(0, 19)]);
      }
    } catch {
      // fallback
    }
  };

  const handleApplyTemplate = (template: PunishmentTemplate) => {
    setPunishForm((f) => ({
      ...f,
      commandId: template.commandId,
      duration: template.defaultDuration || f.duration,
    }));
    setGeneratedCommand("");
  };

  const handleCopy = () => {
    if (!generatedCommand) return;
    navigator.clipboard.writeText(generatedCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (punishForm.static) {
      const log: PunishmentLog = {
        id: Date.now().toString(),
        player: punishForm.static,
        static: punishForm.static,
        duration: punishForm.duration,
        ticketNo: punishForm.ticketNo,
        command: generatedCommand,
        timestamp: new Date().toLocaleTimeString("ru-RU"),
        admin: adminName,
      };
      setLogs((prev) => [log, ...prev.slice(0, 19)]);
    }
  };

  const handleAddCommand = () => {
    if (!newCmd.name || !newCmd.command) return;
    setCommands((prev) => [...prev, { ...newCmd, id: Date.now().toString() }]);
    setNewCmd({ name: "", command: "", description: "", category: "ban" });
    setShowAddCmd(false);
  };

  const handleAddTemplate = () => {
    if (!newTemplate.name || !newTemplate.commandId) return;
    setTemplates((prev) => [...prev, { ...newTemplate, id: Date.now().toString() }]);
    setNewTemplate({ name: "", commandId: "", defaultDuration: "", color: "cyan" });
    setShowAddTemplate(false);
  };

  const navItems = [
    { id: "home", label: "Главная", icon: "LayoutDashboard" },
    { id: "punishments", label: "Наказания", icon: "Gavel" },
    { id: "commands", label: "Команды", icon: "Terminal" },
    { id: "settings", label: "Настройки", icon: "Settings" },
  ] as const;

  return (
    <div className="min-h-screen bg-background grid-bg font-rubik flex">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex w-64 min-h-screen flex-col border-r border-border bg-[hsl(220,22%,7%)] relative z-10">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[hsla(180,100%,50%,0.1)] border border-[hsla(180,100%,50%,0.4)] flex items-center justify-center">
              <Icon name="Shield" size={18} className="neon-text-cyan" />
            </div>
            <div>
              <div className="font-oswald text-sm font-bold neon-text-cyan tracking-widest uppercase">AHK Panel</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Admin System</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 font-medium text-sm
                ${section === item.id
                  ? "bg-[hsla(180,100%,50%,0.1)] border border-[hsla(180,100%,50%,0.35)] neon-text-cyan"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
                }`}
            >
              <Icon name={item.icon} size={16} />
              <span className="font-rubik">{item.label}</span>
              {section === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[hsl(var(--neon-cyan))] animate-pulse-slow" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[hsla(290,100%,60%,0.15)] border border-[hsla(290,100%,60%,0.4)] flex items-center justify-center">
              <Icon name="UserCircle" size={16} className="neon-text-purple" />
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">{adminName}</div>
              <div className="text-[10px] text-muted-foreground">Администратор</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto flex flex-col">
        <header className="h-14 border-b border-border flex items-center px-4 md:px-6 gap-3 bg-[hsla(220,20%,6%,0.8)] backdrop-blur-sm sticky top-0 z-10">
          {/* Mobile: app logo */}
          <div className="flex md:hidden items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[hsla(180,100%,50%,0.1)] border border-[hsla(180,100%,50%,0.4)] flex items-center justify-center">
              <Icon name="Shield" size={14} className="neon-text-cyan" />
            </div>
            <span className="font-oswald text-sm font-bold neon-text-cyan tracking-widest uppercase">AHK Panel</span>
          </div>
          <Icon name="ChevronRight" size={14} className="text-muted-foreground hidden md:block" />
          <span className="text-muted-foreground text-sm hidden md:block">
            {navItems.find((n) => n.id === section)?.label}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <div className="tag-green">ONLINE</div>
            <span className="text-xs text-muted-foreground hidden sm:block">{serverName}</span>
          </div>
        </header>

        <div className="p-4 md:p-6 animate-fade-in pb-24 md:pb-6">

          {/* ── HOME ── */}
          {section === "home" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-oswald text-3xl font-bold tracking-wide uppercase">
                  Панель <span className="neon-text-cyan">управления</span>
                </h1>
                <p className="text-muted-foreground text-sm mt-1">Обзор активности и быстрые действия</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Команды", value: commands.length, icon: "Terminal", colorClass: "neon-text-cyan" },
                  { label: "Шаблоны", value: templates.length, icon: "BookMarked", colorClass: "neon-text-purple" },
                  { label: "Выдано в сессии", value: logs.length, icon: "Gavel", colorClass: "text-orange-400" },
                  { label: "Банов", value: logs.filter((l) => l.command.includes("/ban") || l.command.includes("/tempban")).length, icon: "UserX", colorClass: "neon-text-red" },
                ].map((stat) => (
                  <div key={stat.label} className="card-dark rounded-xl p-5 transition-all duration-200 cursor-default">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className={`text-3xl font-oswald font-bold ${stat.colorClass}`}>{stat.value}</div>
                        <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                      </div>
                      <Icon name={stat.icon} size={20} className="text-muted-foreground opacity-40" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="card-dark rounded-xl p-5">
                <h2 className="font-oswald text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Icon name="Clock" size={14} className="neon-text-cyan" />
                  Последние наказания
                </h2>
                {logs.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    <Icon name="Inbox" size={32} className="mx-auto mb-2 opacity-20" />
                    Наказания ещё не выдавались
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.slice(0, 8).map((log) => (
                      <div key={log.id} className="flex items-center gap-4 px-4 py-3 rounded-lg bg-secondary/50 text-sm hover:bg-secondary transition-colors">
                        <span className="text-muted-foreground text-xs w-14 shrink-0">{log.timestamp}</span>
                        <span className="font-medium text-foreground w-28 truncate">{log.player}</span>
                        <code className="flex-1 text-xs neon-text-cyan truncate font-mono">{log.command}</code>
                        {log.ticketNo && <span className="tag-cyan shrink-0">#{log.ticketNo}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={() => setSection("punishments")} className="neon-btn-red rounded-xl p-4 text-left">
                  <Icon name="Gavel" size={20} className="mb-2" />
                  <div className="font-semibold text-sm">Выдать наказание</div>
                  <div className="text-xs opacity-60 mt-0.5">Открыть панель</div>
                </button>
                <button onClick={() => setSection("commands")} className="neon-btn-cyan rounded-xl p-4 text-left">
                  <Icon name="Plus" size={20} className="mb-2" />
                  <div className="font-semibold text-sm">Добавить команду</div>
                  <div className="text-xs opacity-60 mt-0.5">Управление командами</div>
                </button>
                <button onClick={() => setSection("settings")} className="neon-btn-purple rounded-xl p-4 text-left">
                  <Icon name="Settings" size={20} className="mb-2" />
                  <div className="font-semibold text-sm">Настройки</div>
                  <div className="text-xs opacity-60 mt-0.5">Конфигурация панели</div>
                </button>
              </div>
            </div>
          )}

          {/* ── PUNISHMENTS ── */}
          {section === "punishments" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-oswald text-3xl font-bold tracking-wide uppercase">
                  <span className="neon-text-red">Наказания</span>
                </h1>
                <p className="text-muted-foreground text-sm mt-1">Генерация команд для выдачи наказаний</p>
              </div>

              {/* Templates */}
              <div className="card-dark rounded-xl p-5">
                <h2 className="font-oswald text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Icon name="Zap" size={13} />
                  Быстрые шаблоны
                </h2>
                <div className="flex flex-wrap gap-2">
                  {templates.map((t) => {
                    const colors = templateColorMap[t.color];
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleApplyTemplate(t)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-150 hover:scale-105 active:scale-95 text-foreground ${colors.border}`}
                      >
                        {t.name}
                        {t.defaultDuration && <span className="ml-2 text-xs opacity-50">{t.defaultDuration}</span>}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setShowAddTemplate(!showAddTemplate)}
                    className="px-4 py-2 rounded-lg border border-dashed border-border text-muted-foreground text-sm hover:border-foreground/30 hover:text-foreground transition-all"
                  >
                    + Новый шаблон
                  </button>
                </div>

                {showAddTemplate && (
                  <div className="mt-4 p-4 rounded-lg bg-secondary/50 border border-border animate-fade-in space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Новый шаблон</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <input className="input-neon rounded-lg px-3 py-2 text-sm w-full" placeholder="Название шаблона"
                        value={newTemplate.name} onChange={(e) => setNewTemplate((p) => ({ ...p, name: e.target.value }))} />
                      <select className="input-neon rounded-lg px-3 py-2 text-sm w-full"
                        value={newTemplate.commandId} onChange={(e) => setNewTemplate((p) => ({ ...p, commandId: e.target.value }))}>
                        <option value="">Выбрать команду</option>
                        {commands.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <input className="input-neon rounded-lg px-3 py-2 text-sm w-full" placeholder="Время по умолчанию (30m, 1d...)"
                        value={newTemplate.defaultDuration} onChange={(e) => setNewTemplate((p) => ({ ...p, defaultDuration: e.target.value }))} />
                      <select className="input-neon rounded-lg px-3 py-2 text-sm w-full"
                        value={newTemplate.color} onChange={(e) => setNewTemplate((p) => ({ ...p, color: e.target.value as PunishmentTemplate["color"] }))}>
                        <option value="red">Красный</option>
                        <option value="orange">Оранжевый</option>
                        <option value="cyan">Синий</option>
                        <option value="purple">Фиолетовый</option>
                      </select>
                    </div>
                    <button onClick={handleAddTemplate} className="neon-btn-cyan px-4 py-2 rounded-lg text-sm font-medium">
                      Создать шаблон
                    </button>
                  </div>
                )}
              </div>

              {/* Form */}
              <div className="card-dark rounded-xl p-5">
                <h2 className="font-oswald text-base font-semibold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Icon name="UserX" size={15} className="neon-text-red" />
                  Данные наказания
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Статик (ID / IP) *</label>
                    <input className="input-neon rounded-lg px-3 py-2.5 text-sm w-full" placeholder="12345 / 127.0.0.1"
                      value={punishForm.static} onChange={(e) => setPunishForm((p) => ({ ...p, static: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Команда *</label>
                    <select className="input-neon rounded-lg px-3 py-2.5 text-sm w-full"
                      value={punishForm.commandId} onChange={(e) => setPunishForm((p) => ({ ...p, commandId: e.target.value }))}>
                      <option value="">Выберите команду</option>
                      {commands.map((c) => <option key={c.id} value={c.id}>/{c.command} — {c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Время наказания</label>
                    <input className="input-neon rounded-lg px-3 py-2.5 text-sm w-full" placeholder="30m / 1d / permanent"
                      value={punishForm.duration} onChange={(e) => setPunishForm((p) => ({ ...p, duration: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest">№ Обращения</label>
                    <input className="input-neon rounded-lg px-3 py-2.5 text-sm w-full" placeholder="1234"
                      value={punishForm.ticketNo} onChange={(e) => setPunishForm((p) => ({ ...p, ticketNo: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Причина</label>
                    <input className="input-neon rounded-lg px-3 py-2.5 text-sm w-full" placeholder="Причина наказания"
                      value={punishForm.reason} onChange={(e) => setPunishForm((p) => ({ ...p, reason: e.target.value }))} />
                  </div>
                </div>

                {/* Preview live */}
                {(punishForm.static && punishForm.commandId) && (
                  <div className="mt-4 command-output text-sm animate-fade-in">
                    {buildCommand()}
                  </div>
                )}

                <div className="mt-5 flex gap-3 flex-wrap">
                  <button onClick={handleAutoInsert}
                    className="neon-btn-cyan px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                    <Icon name={autoInserted ? "Check" : "Gamepad2"} size={15} />
                    {autoInserted ? "Скопировано! Вставьте в игру (Ctrl+V)" : "Вставить в игру"}
                  </button>
                  <button onClick={handleGenerate}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                    <Icon name="Zap" size={14} />
                    Показать команду
                  </button>
                </div>

                {autoInserted && (
                  <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[hsla(130,100%,45%,0.08)] border border-[hsla(130,100%,45%,0.3)] animate-fade-in">
                    <Icon name="Info" size={13} className="text-green-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-green-400">
                      Команда скопирована. Переключитесь в игру → откройте чат → нажмите <kbd className="bg-[hsla(0,0%,100%,0.1)] px-1.5 py-0.5 rounded text-[10px] font-mono">Ctrl+V</kbd> → <kbd className="bg-[hsla(0,0%,100%,0.1)] px-1.5 py-0.5 rounded text-[10px] font-mono">Enter</kbd>
                    </p>
                  </div>
                )}
              </div>

              {/* Output (когда нажато "Показать") */}
              {generatedCommand && (
                <div className="card-dark rounded-xl p-5 animate-scale-in border neon-border-cyan">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Готовая команда</span>
                    <button onClick={handleCopy}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all
                        ${copied ? "bg-green-500/20 text-green-400 border border-green-500/40" : "neon-btn-cyan"}`}>
                      <Icon name={copied ? "Check" : "Copy"} size={13} />
                      {copied ? "Скопировано!" : "Копировать"}
                    </button>
                  </div>
                  <div className="command-output text-base select-all">{generatedCommand}</div>
                </div>
              )}

              {/* Session log */}
              {logs.length > 0 && (
                <div className="card-dark rounded-xl p-5">
                  <h2 className="font-oswald text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Icon name="History" size={13} />
                    История сессии
                  </h2>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/40 text-xs">
                        <span className="text-muted-foreground shrink-0">{log.timestamp}</span>
                        <span className="text-foreground font-medium shrink-0 w-24 truncate">{log.player}</span>
                        <code className="neon-text-cyan flex-1 truncate font-mono">{log.command}</code>
                        {log.ticketNo && <span className="tag-cyan shrink-0">#{log.ticketNo}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── COMMANDS ── */}
          {section === "commands" && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="font-oswald text-3xl font-bold tracking-wide uppercase">
                    <span className="neon-text-cyan">Команды</span>
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">Список команд для наказаний</p>
                </div>
                <button onClick={() => setShowAddCmd(!showAddCmd)}
                  className="neon-btn-cyan px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                  <Icon name="Plus" size={15} />
                  Добавить
                </button>
              </div>

              {showAddCmd && (
                <div className="card-dark rounded-xl p-5 border neon-border-cyan animate-fade-in">
                  <h2 className="font-oswald text-sm font-semibold text-foreground uppercase tracking-widest mb-4">Новая команда</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Название</label>
                      <input className="input-neon rounded-lg px-3 py-2.5 text-sm w-full" placeholder="Бан"
                        value={newCmd.name} onChange={(e) => setNewCmd((p) => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Команда (без /)</label>
                      <input className="input-neon rounded-lg px-3 py-2.5 text-sm w-full" placeholder="ban"
                        value={newCmd.command} onChange={(e) => setNewCmd((p) => ({ ...p, command: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Описание</label>
                      <input className="input-neon rounded-lg px-3 py-2.5 text-sm w-full" placeholder="Описание команды"
                        value={newCmd.description} onChange={(e) => setNewCmd((p) => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Категория</label>
                      <select className="input-neon rounded-lg px-3 py-2.5 text-sm w-full"
                        value={newCmd.category} onChange={(e) => setNewCmd((p) => ({ ...p, category: e.target.value as Command["category"] }))}>
                        <option value="ban">Бан</option>
                        <option value="mute">Мут</option>
                        <option value="kick">Кик</option>
                        <option value="warn">Варн</option>
                        <option value="other">Прочее</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={handleAddCommand} className="neon-btn-cyan px-5 py-2 rounded-lg text-sm font-semibold">
                      Добавить
                    </button>
                    <button onClick={() => setShowAddCmd(false)} className="px-5 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground transition-colors">
                      Отмена
                    </button>
                  </div>
                </div>
              )}

              <div className="grid gap-3">
                {commands.map((cmd) => (
                  <div key={cmd.id} className="card-dark rounded-xl px-5 py-4 flex items-center gap-4 hover:border-[hsla(180,100%,50%,0.2)] transition-all">
                    <div className="w-10 h-10 rounded-lg bg-[hsla(180,100%,50%,0.07)] border border-[hsla(180,100%,50%,0.2)] flex items-center justify-center shrink-0">
                      <Icon name="Terminal" size={16} className="neon-text-cyan opacity-70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-foreground text-sm">{cmd.name}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${categoryColors[cmd.category]}`}>
                          {categoryLabels[cmd.category]}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">{cmd.description}</div>
                    </div>
                    <div className="command-output text-xs px-3 py-1.5 shrink-0 hidden sm:block">/{cmd.command} [static]</div>
                    <button onClick={() => setCommands((prev) => prev.filter((c) => c.id !== cmd.id))}
                      className="text-muted-foreground hover:text-red-400 transition-colors shrink-0 p-1">
                      <Icon name="Trash2" size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {section === "settings" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-oswald text-3xl font-bold tracking-wide uppercase">
                  <span className="neon-text-purple">Настройки</span>
                </h1>
                <p className="text-muted-foreground text-sm mt-1">Конфигурация панели</p>
              </div>

              <div className="card-dark rounded-xl p-6 border neon-border-purple space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Имя администратора</label>
                  <input className="input-neon rounded-lg px-3 py-2.5 text-sm w-full max-w-sm" value={adminName}
                    onChange={(e) => setAdminName(e.target.value)} placeholder="Ваш ник" />
                  <p className="text-xs text-muted-foreground">Отображается в логах наказаний</p>
                </div>

                <div className="border-t border-border pt-5 space-y-2">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Название сервера</label>
                  <input className="input-neon rounded-lg px-3 py-2.5 text-sm w-full max-w-sm" value={serverName}
                    onChange={(e) => setServerName(e.target.value)} placeholder="Название вашего сервера" />
                  <p className="text-xs text-muted-foreground">Отображается в шапке панели</p>
                </div>

                <div className="border-t border-border pt-5">
                  <h3 className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Управление данными</h3>
                  <button onClick={() => setLogs([])}
                    className="neon-btn-red px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                    <Icon name="Trash2" size={14} />
                    Очистить логи сессии
                  </button>
                </div>

                <div className="border-t border-border pt-5">
                  <h3 className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Формат команды</h3>
                  <div className="command-output text-xs leading-relaxed">
                    <span className="text-muted-foreground"># Шаблон:</span>{"\n"}
                    /[команда] [статик] [время] [причина] #[обращение]{"\n\n"}
                    <span className="text-muted-foreground"># Пример:</span>{"\n"}
                    /ban 12345 permanent Читы #1337
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Nav — mobile only */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-[hsl(220,22%,7%)] flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all duration-200 text-[10px] font-medium uppercase tracking-widest
                ${section === item.id ? "neon-text-cyan" : "text-muted-foreground"}`}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
              {section === item.id && (
                <div className="absolute bottom-0 w-8 h-0.5 bg-[hsl(var(--neon-cyan))] rounded-t-full" />
              )}
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}