import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TopBar({ title, subtitle, action, isMobile }) {
  return (
    <header className={`flex h-14 items-center justify-between border-b border-border bg-card ${isMobile ? "px-4" : "px-6"}`}>
      <div>
        <h1 className="font-display text-lg font-semibold text-foreground">{title}</h1>
        {!isMobile && subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {action && (
          <Button size="sm" onClick={action.onClick} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            {action.label}
          </Button>
        )}
        {!isMobile && (
          <>
            <button className="relative rounded-md p-2 text-muted-foreground hover:bg-muted transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
            </button>
            <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              SJ
            </div>
          </>
        )}
      </div>
    </header>
  );
}
