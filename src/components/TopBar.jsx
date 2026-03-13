import { Bell, Plus, Upload, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function TopBar({ title, subtitle, action, secondaryAction, isMobile }) {
  const { signOut, user } = useAuth();

  return (
    <header className={`flex h-14 items-center justify-between border-b border-border bg-card ${isMobile ? "px-4" : "px-6"}`}>
      <div>
        <h1 className="font-display text-lg font-semibold text-foreground">{title}</h1>
        {!isMobile && subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {secondaryAction && (
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
            <button className="relative rounded-md p-2 text-muted-foreground hover:bg-muted transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
            </button>
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
