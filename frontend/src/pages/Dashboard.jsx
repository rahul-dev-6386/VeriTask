import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Calendar,
  CheckCheck,
  Clock3,
  FileText,
  Filter,
  LogOut,
  Moon,
  PanelTopOpen,
  Plus,
  Search,
  Send,
  Sparkles,
  Sun,
  Target,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import api, { getErrorMessage } from "../lib/api";

const quickFilters = [
  { id: "all", label: "All tasks" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "overdue", label: "Overdue" },
];

export default function Dashboard({ theme, setTheme }) {
  const navigate = useNavigate();
  const aiEndRef = useRef(null);

  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [expandedTask, setExpandedTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
  });
  const [assistant, setAssistant] = useState({
    open: false,
    input: "",
    loading: false,
    messages: [
      {
        role: "ai",
        text: "TaskSarthi is ready to help you add tasks, review priorities, and stay on track.",
      },
    ],
  });

  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [assistant.messages, assistant.loading]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [userResponse, todoResponse] = await Promise.all([api.get("/user"), api.get("/todo")]);
        setUser(userResponse.data);
        setTodos(todoResponse.data.todos || []);
      } catch {
        navigate("/", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [navigate]);

  const filteredTodos = useMemo(() => {
    return todos
      .filter((todo) => {
        if (filter === "active") return !todo.done;
        if (filter === "completed") return todo.done;
        if (filter === "overdue") return isOverdue(todo.dueDate, todo.done);
        return true;
      })
      .filter((todo) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        return [todo.title, todo.description].filter(Boolean).some((value) => value.toLowerCase().includes(query));
      })
      .sort((first, second) => Number(first.done) - Number(second.done));
  }, [filter, searchQuery, todos]);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((todo) => todo.done).length;
    const active = total - completed;
    const overdue = todos.filter((todo) => isOverdue(todo.dueDate, todo.done)).length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    return { total, completed, active, overdue, completionRate };
  }, [todos]);

  const agenda = useMemo(() => {
    return todos
      .filter((todo) => !todo.done && todo.dueDate)
      .sort((first, second) => new Date(first.dueDate) - new Date(second.dueDate))
      .slice(0, 4);
  }, [todos]);

  const focusScore = useMemo(() => {
    if (!stats.total) {
      return 100;
    }

    const completionScore = Math.round((stats.completed / stats.total) * 100);
    const overduePenalty = stats.overdue * 8;
    return Math.max(0, Math.min(100, completionScore - overduePenalty));
  }, [stats]);

  const completionLabel =
    stats.total === 0
      ? "Ready for your first task"
      : `${stats.completed} of ${stats.total} tasks completed`;

  const clearErrorSoon = (message) => {
    setError(message);
    window.setTimeout(() => setError(""), 3500);
  };

  const refreshTodos = async () => {
    const response = await api.get("/todo");
    setTodos(response.data.todos || []);
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      clearErrorSoon("Please add a task title.");
      return;
    }

    setSaving(true);
    try {
      const response = await api.post("/todo", {
        title: newTask.title.trim(),
        description: newTask.description.trim() || null,
        dueDate: newTask.dueDate || null,
      });

      setTodos((current) => [response.data.todo, ...current]);
      setNewTask({ title: "", description: "", dueDate: "" });
      setComposerOpen(false);
    } catch (requestError) {
      clearErrorSoon(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTask = async (todoId, done) => {
    try {
      await api.put("/todo", { todoId, done: !done });
      setTodos((current) =>
        current.map((todo) => (todo._id === todoId ? { ...todo, done: !done } : todo))
      );
    } catch (requestError) {
      clearErrorSoon(getErrorMessage(requestError));
    }
  };

  const handleDeleteTask = async (todoId) => {
    try {
      await api.delete("/todo", { data: { todoId } });
      setTodos((current) => current.filter((todo) => todo._id !== todoId));
    } catch (requestError) {
      clearErrorSoon(getErrorMessage(requestError));
    }
  };

  const handleLogout = async (logoutEverywhere = false) => {
    try {
      await api.post(logoutEverywhere ? "/logoutfromAlldevices" : "/logout");
    } catch {
      // If the server session is already gone, we still take the user back safely.
    } finally {
      navigate("/", { replace: true });
    }
  };

  const handleAssistantSend = async () => {
    const prompt = assistant.input.trim();

    if (!prompt || assistant.loading) {
      return;
    }

    setAssistant((current) => ({
      ...current,
      input: "",
      loading: true,
      messages: [...current.messages, { role: "user", text: prompt }],
    }));

    try {
      const response = await api.post("/agent", { prompt });
      const result = response.data.data;

      if (result.action === "add" && result.taskTitle) {
        await api.post("/todo", {
          title: result.taskTitle,
          description: result.taskDescription || null,
          dueDate: null,
        });
        await refreshTodos();
      }

      setAssistant((current) => ({
        ...current,
        loading: false,
        messages: [
          ...current.messages,
          {
            role: "ai",
            text: result.replyText || "Done. I processed that request.",
          },
        ],
      }));
    } catch (requestError) {
      setAssistant((current) => ({
        ...current,
        loading: false,
        messages: [
          ...current.messages,
          {
            role: "ai",
            text: getErrorMessage(requestError, "I couldn't process that request just now."),
          },
        ],
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center">
        <div className="rounded-3xl border border-[var(--border-soft)] bg-[var(--panel)] px-6 py-5 shadow-xl shadow-black/[0.05]">
          <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent-soft)] border-t-[var(--accent)]" />
            Loading your dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--text-strong)]">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <header className="relative overflow-hidden rounded-[32px] border border-[var(--border-soft)] bg-[var(--panel)] p-5 shadow-xl shadow-black/[0.05] backdrop-blur sm:p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[linear-gradient(135deg,rgba(15,157,114,0.08),rgba(37,99,235,0.05),transparent)]" />
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--panel-soft)] px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-[var(--text-subtle)]">
                <Sparkles size={12} />
                VeriTask
              </div>
              <p className="mt-4 text-xs uppercase tracking-[0.24em] text-[var(--text-subtle)]">Dashboard</p>
              <p className="mt-3 text-sm font-medium uppercase tracking-[0.24em] text-[var(--accent)]">
                Plan smart. Work better.
              </p>
              <h1 className="mt-3 font-display text-3xl tracking-[-0.04em] sm:text-4xl">
                {greeting()}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
                {stats.active === 0
                  ? "Everything is in good shape. Use the assistant or create a new task to keep momentum."
                  : `You have ${stats.active} active task${stats.active === 1 ? "" : "s"} and ${stats.overdue} overdue item${stats.overdue === 1 ? "" : "s"}.`}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-emerald-200/70 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                <CheckCheck size={14} />
                {completionLabel}
              </div>
            </div>

            <div className="relative grid w-full gap-3 sm:grid-cols-3 lg:w-auto lg:min-w-[420px]">
              <button
                onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                title={theme === "light" ? "Dark mode" : "Light mode"}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-3 text-[var(--text-muted)] transition hover:text-[var(--text-strong)]"
              >
                {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <button
                onClick={() => setComposerOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--accent-shadow)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
              >
                <Plus size={16} />
                New task
              </button>
              <button
                onClick={() => handleLogout(false)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-3 text-sm text-[var(--text-muted)] transition hover:text-[var(--text-strong)]"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>

          <div className="relative mt-6 grid gap-4 xl:grid-cols-[1.3fr_0.95fr]">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total tasks" value={stats.total} note="Across VeriTask" accent="var(--accent)" />
              <StatCard label="Completed" value={stats.completed} note={`${stats.completionRate}% completion`} accent="#0f9d72" />
              <StatCard label="In progress" value={stats.active} note="Still open" accent="#2563eb" />
              <StatCard label="Overdue" value={stats.overdue} note="Needs attention" accent="#dc2626" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-3xl border border-[var(--border-soft)] bg-[var(--panel-soft)] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                    <UserRound size={20} />
                  </div>
                  <div>
                  <p className="text-sm font-semibold text-[var(--text-strong)]">{user?.name || "VeriTask user"}</p>
                    <p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-[var(--panel)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-subtle)]">Session</p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">Backend-managed cookies with refresh support</p>
                  </div>
                  <button
                    onClick={() => handleLogout(true)}
                    className="rounded-xl border border-[var(--border-soft)] px-3 py-2 text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--text-strong)]"
                  >
                    Logout all
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--border-soft)] bg-[var(--panel-soft)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-subtle)]">Focus score</p>
                    <h2 className="mt-2 text-xl font-semibold">{focusScore}% on track</h2>
                  </div>
                  <div className="rounded-2xl bg-[var(--panel)] p-3 text-[var(--accent)]">
                    <Target size={18} />
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                  This score now starts from completed tasks versus total tasks, then lightly reduces for overdue work.
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--panel)]">
                  <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${focusScore}%` }} />
                </div>
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_0.9fr]">
          <section className="space-y-6">
            <div className="rounded-[32px] border border-[var(--border-soft)] bg-[var(--panel)] p-5 shadow-xl shadow-black/[0.04]">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-subtle)]">Tasks</p>
                  <h2 className="mt-2 text-xl font-semibold">Task status</h2>
                </div>
                <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-[var(--border-soft)] bg-[var(--panel-soft)] px-3 py-2 text-xs text-[var(--text-muted)]">
                  <PanelTopOpen size={14} />
                  Mobile ready
                </div>
              </div>

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-md">
                  <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by title or description"
                    className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--panel-soft)] py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[var(--accent)]"
                  />
                </div>

                <div className="-mx-1 flex w-full gap-2 overflow-x-auto px-1 pb-1 sm:w-auto lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
                  {quickFilters.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setFilter(item.id)}
                      className={`shrink-0 rounded-full px-4 py-2 text-sm transition sm:px-4 ${
                        filter === item.id
                          ? "bg-[var(--text-strong)] text-[var(--page-bg)]"
                          : "border border-[var(--border-soft)] bg-[var(--panel-soft)] text-[var(--text-muted)]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {filteredTodos.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-[var(--border-soft)] bg-[var(--panel-soft)] px-6 py-12 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                      <Filter size={22} />
                    </div>
                    <h2 className="text-lg font-semibold">No tasks match this view</h2>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                      Try a different filter or create a new task to populate the dashboard.
                    </p>
                  </div>
                ) : (
                  filteredTodos.map((todo) => {
                    const overdue = isOverdue(todo.dueDate, todo.done);
                    const expanded = expandedTask === todo._id;

                    return (
                      <article
                        key={todo._id}
                        className={`rounded-3xl border p-4 transition ${
                          todo.done
                            ? "border-emerald-200 bg-emerald-50/90 shadow-[0_14px_35px_rgba(15,157,114,0.08)] dark:border-emerald-900/40 dark:bg-emerald-950/20"
                            : overdue && !todo.done
                              ? "border-red-200 bg-red-50/70 dark:border-red-900/40 dark:bg-red-950/20"
                              : "border-[var(--border-soft)] bg-[var(--panel-soft)] hover:border-[var(--border-strong)]"
                        }`}
                      >
                        <div className="flex gap-3 sm:gap-4">
                          <button
                            onClick={() => handleToggleTask(todo._id, todo.done)}
                            className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                              todo.done
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-[var(--border-strong)] bg-white dark:bg-transparent"
                            }`}
                          >
                            {todo.done && <CheckCheck size={14} />}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <h2 className={`text-base font-semibold ${todo.done ? "text-emerald-800 dark:text-emerald-200" : ""}`}>
                                  {todo.title}
                                </h2>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                                  <Badge icon={Clock3} label={formatCreatedAt(todo.createdAt)} />
                                  {todo.dueDate && (
                                    <Badge
                                      icon={Calendar}
                                      label={overdue ? `Overdue · ${formatDate(todo.dueDate)}` : formatDate(todo.dueDate)}
                                      tone={overdue ? "danger" : "neutral"}
                                    />
                                  )}
                                  <Badge
                                    icon={CheckCheck}
                                    label={todo.done ? "Completed" : "Active"}
                                    tone={todo.done ? "success" : "neutral"}
                                  />
                                </div>
                              </div>

                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center md:shrink-0">
                                {todo.description && (
                                  <button
                                    onClick={() => setExpandedTask(expanded ? null : todo._id)}
                                    className="w-full rounded-xl border border-[var(--border-soft)] px-3 py-2 text-sm text-[var(--text-muted)] transition hover:text-[var(--text-strong)] sm:w-auto"
                                  >
                                    <span className="inline-flex items-center gap-2">
                                      <FileText size={14} />
                                      {expanded ? "Hide notes" : "View notes"}
                                    </span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteTask(todo._id)}
                                  className="w-full rounded-xl border border-[var(--border-soft)] px-3 py-2 text-sm text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30 sm:w-auto"
                                >
                                  <span className="inline-flex items-center gap-2">
                                    <Trash2 size={14} />
                                    Delete
                                  </span>
                                </button>
                              </div>
                            </div>

                            {expanded && todo.description && (
                              <div className="mt-4 rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] p-4 text-sm leading-6 text-[var(--text-muted)]">
                                {todo.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[32px] border border-[var(--border-soft)] bg-[var(--panel)] p-5 shadow-xl shadow-black/[0.04]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-subtle)]">Upcoming</p>
                  <h2 className="mt-2 text-xl font-semibold">Next deadlines</h2>
                </div>
                <div className="rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent)]">
                  <Calendar size={18} />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {agenda.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-[var(--border-soft)] px-4 py-5 text-sm text-[var(--text-muted)]">
                    No upcoming due dates yet. Add one to keep your week structured.
                  </p>
                ) : (
                  agenda.map((todo) => (
                    <div key={todo._id} className="rounded-2xl border border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-4">
                      <p className="font-medium">{todo.title}</p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{formatDate(todo.dueDate)}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-5 right-4 z-40 sm:bottom-6 sm:right-6">
        {assistant.open && (
          <section className="mb-3 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-[28px] border border-[var(--border-soft)] bg-[var(--panel)] shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:w-[380px]">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border-soft)] px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-subtle)]">Assistant</p>
                <h2 className="mt-1 text-lg font-semibold">TaskSarthi</h2>
              </div>
              <button
                onClick={() => setAssistant((current) => ({ ...current, open: false }))}
                className="rounded-xl border border-[var(--border-soft)] p-2 text-[var(--text-muted)] transition hover:text-[var(--text-strong)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[320px] space-y-3 overflow-y-auto px-5 py-4">
              {assistant.messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--panel-soft)] text-[var(--text-muted)]"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {assistant.loading && (
                <div className="rounded-2xl bg-[var(--panel-soft)] px-4 py-3 text-sm text-[var(--text-muted)]">
                  Thinking...
                </div>
              )}
              <div ref={aiEndRef} />
            </div>

            <div className="border-t border-[var(--border-soft)] px-5 py-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={assistant.input}
                  onChange={(event) =>
                    setAssistant((current) => ({ ...current, input: event.target.value }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleAssistantSend();
                    }
                  }}
                  placeholder='Try "add a task to submit the assignment tomorrow"'
                  className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                />
                <button
                  onClick={handleAssistantSend}
                  disabled={assistant.loading || !assistant.input.trim()}
                  className="inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-3 text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="mt-3 text-xs text-[var(--text-subtle)]">
                TaskSarthi can suggest, chat, and add tasks when the backend returns an add action.
              </p>
            </div>
          </section>
        )}

        <button
          onClick={() => setAssistant((current) => ({ ...current, open: !current.open }))}
          className="ml-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-[0_18px_40px_rgba(15,157,114,0.35)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
          aria-label={assistant.open ? "Close TaskSarthi" : "Open TaskSarthi"}
          title={assistant.open ? "Close TaskSarthi" : "Open TaskSarthi"}
        >
          <Sparkles size={20} />
        </button>
      </div>

      {composerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.28)] p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[32px] border border-[var(--border-soft)] bg-[var(--panel)] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.2)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-subtle)]">Create task</p>
                <h2 className="mt-2 font-display text-2xl tracking-[-0.03em] sm:text-3xl">Create task</h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Add a title, description, and due date for your task.
                </p>
              </div>
              <button
                onClick={() => setComposerOpen(false)}
                className="rounded-2xl border border-[var(--border-soft)] p-3 text-[var(--text-muted)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <ComposerField
                label="Task title"
                value={newTask.title}
                onChange={(value) => setNewTask((current) => ({ ...current, title: value }))}
                placeholder="Prepare MongoDB schema review"
              />

              <ComposerTextarea
                label="Description"
                value={newTask.description}
                onChange={(value) => setNewTask((current) => ({ ...current, description: value }))}
                placeholder="Add any details that help you or the AI understand the task."
              />

              <ComposerField
                label="Due date"
                type="date"
                value={newTask.dueDate}
                onChange={(value) => setNewTask((current) => ({ ...current, dueDate: value }))}
              />
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={() => setComposerOpen(false)}
                className="rounded-2xl border border-[var(--border-soft)] px-4 py-3 text-sm text-[var(--text-muted)]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                disabled={saving}
                className="rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--accent-shadow)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Saving..." : "Create task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, note, accent }) {
  return (
    <article className="rounded-3xl border border-[var(--border-soft)] bg-[var(--panel-soft)] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.03)]">
      <div className="h-1.5 w-14 rounded-full" style={{ backgroundColor: accent }} />
      <p className="mt-4 text-sm text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[var(--text-strong)]">{value}</p>
      <p className="mt-2 text-sm text-[var(--text-subtle)]">{note}</p>
    </article>
  );
}

function Badge({ icon, label, tone = "neutral" }) {
  const tones = {
    neutral: "border-[var(--border-soft)] bg-[var(--panel)] text-[var(--text-muted)]",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300",
    danger: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${tones[tone]}`}>
      {createElement(icon, { size: 12 })}
      {label}
    </span>
  );
}

function ComposerField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[var(--text-strong)]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
      />
    </label>
  );
}

function ComposerTextarea({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[var(--text-strong)]">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-28 w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--panel-soft)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
      />
    </label>
  );
}

function isOverdue(dueDate, done) {
  if (!dueDate || done) {
    return false;
  }

  const due = new Date(dueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCreatedAt(value) {
  if (!value) {
    return "Recently added";
  }

  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
