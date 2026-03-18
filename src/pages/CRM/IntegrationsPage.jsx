import { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Unplug, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

export default function IntegrationsPage({ alerts = [] }) {
  const { gmailConnected, gmailAddress, refreshGmailStatus } = useAuth();
  const [disconnecting, setDisconnecting] = useState(false);

  // Refresh Gmail status when page loads (e.g., after OAuth callback redirect)
  useEffect(() => {
    refreshGmailStatus();
  }, [refreshGmailStatus]);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session.access_token}` };
  };

  const handleConnectGmail = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/gmail-auth-url", { headers });
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      toast({ title: "Error", description: "Failed to start Gmail connection", variant: "destructive" });
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/gmail-disconnect", { method: "POST", headers });
      if (!res.ok) throw new Error();
      await refreshGmailStatus();
      toast({ title: "Gmail disconnected" });
    } catch {
      toast({ title: "Error", description: "Failed to disconnect Gmail", variant: "destructive" });
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Integrations" subtitle="Connect external services" alerts={alerts} />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-4">
          {/* Gmail Card */}
          <div className="rounded-lg border border-border bg-card p-5 shadow-crm-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-500/10">
                  <Mail className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Gmail</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Send emails directly from your Gmail account when composing emails to leads.
                  </p>
                </div>
              </div>
              {gmailConnected && (
                <Badge variant="secondary" className="bg-success/10 text-success shrink-0">
                  Connected
                </Badge>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              {gmailConnected ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-foreground">
                    Connected as <span className="font-medium">{gmailAddress}</span>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="text-destructive hover:text-destructive"
                  >
                    {disconnecting ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Unplug className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleConnectGmail}>
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Connect Gmail
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    or sign in with Google on the login page
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Placeholder for future integrations */}
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-5 text-center">
            <p className="text-sm text-muted-foreground">More integrations coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
