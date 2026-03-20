import { useMemo } from "react";
import {
  LayoutDashboard,
  UserPlus,
  Handshake,
  CalendarDays,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  Bot,
  Settings,
} from "lucide-react";

const navItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "leads", icon: UserPlus, label: "Leads" },
  { id: "referrers", icon: Handshake, label: "Referrers" },
  { id: "chatbot", icon: Bot, label: "AI Assistant" },
];

const bottomNavItems = [
  { id: "settings", icon: Settings, label: "Settings" },
];

export default function AppSidebar({ collapsed, onToggle, currentPage, onNavigate, tasks = [] }) {
  const today = new Date().toISOString().split("T")[0];
  const pendingToday = useMemo(
    () => tasks.filter((t) => t.status === "pending" && t.due_date <= today),
    [tasks, today]
  );
  const hasOverdue = useMemo(
    () => tasks.some((t) => t.status === "pending" && t.due_date < today),
    [tasks, today]
  );
  const taskCount = pendingToday.length;

  return (
    <aside
      className={`flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo + collapse toggle */}
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-display text-base font-semibold text-sidebar-foreground truncate">
              Trilio CRM
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="flex shrink-0 items-center justify-center rounded-md p-1.5 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          title={collapsed ? "Open sidebar" : "Close sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-3 flex-1 space-y-0.5 px-2">
        {navItems.map(({ id, icon: Icon, label }) => {
          const active = currentPage === id;
          const showBadge = id === "dashboard" && taskCount > 0;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <div className="relative shrink-0">
                <Icon className="h-4 w-4" />
                {showBadge && collapsed && (
                  <span className={`absolute -top-1.5 -right-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full px-0.5 text-[9px] font-bold text-white ${hasOverdue ? "bg-destructive" : "bg-primary"}`}>
                    {taskCount}
                  </span>
                )}
              </div>
              {!collapsed && (
                <>
                  <span>{label}</span>
                  {showBadge && (
                    <span className={`ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${hasOverdue ? "bg-destructive" : "bg-primary"}`}>
                      {taskCount}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="border-t border-sidebar-border px-2 py-2 space-y-0.5">
        {bottomNavItems.map(({ id, icon: Icon, label }) => {
          const active = currentPage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
