import { useState, useRef, useEffect } from "react";
import { Bell, Plus, Upload, LogOut, Clock, AlertTriangle, Settings, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigation } from "@/contexts/NavigationContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function NotificationPanel({ alerts, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 w-80 rounded-lg border border-border bg-card shadow-lg z-50"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="text-sm font-semibold text-foreground">Notifications</span>
        {alerts.length > 0 && (
          <span className="text-xs text-muted-foreground">{alerts.length} alert{alerts.length !== 1 ? "s" : ""}</span>
        )}
      </div>
      <div className="max-h-72 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No alerts</div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 border-b border-border/50 px-4 py-3 last:border-0 hover:bg-muted/50 transition-colors">
              {alert.type === "inquiry_aging" ? (
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{alert.leadName}</p>
                <p className="text-xs text-muted-foreground">{alert.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function TopBar({ title, subtitle, action, secondaryAction, isMobile, alerts = [] }) {
  const { signOut, user } = useAuth();
  const { navigate } = useNavigation();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className={`flex h-14 items-center justify-between border-b border-border bg-card ${isMobile ? "px-4" : "px-6"}`}>
      <div>
        <h1 className="font-display text-lg font-semibold text-foreground">{title}</h1>
        {!isMobile && subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {secondaryAction && !isMobile && (
          <Button size="sm" variant="outline" onClick={secondaryAction.onClick} className="gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            {secondaryAction.label}
          </Button>
        )}
        {action && (
          <Button size="sm" onClick={action.onClick} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            {action.label}
          </Button>
        )}
        {!isMobile && (
          <>
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative rounded-md p-2 text-muted-foreground hover:bg-muted transition-colors"
              >
                <Bell className="h-4 w-4" />
                {alerts.length > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                    {alerts.length > 9 ? "9+" : alerts.length}
                  </span>
                )}
              </button>
              {notifOpen && <NotificationPanel alerts={alerts} onClose={() => setNotifOpen(false)} />}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                      {user?.email?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate('settings')}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('integrations')}
                  className="cursor-pointer"
                >
                  <Plug className="mr-2 h-4 w-4" />
                  Integrations
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  );
}
