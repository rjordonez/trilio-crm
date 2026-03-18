import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import '../../crm.css';

export default function PendingApprovalPage() {
  const { user, organization, leaveOrganization, refreshOrganization, signOut } = useAuth();

  // Poll for approval every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshOrganization();
    }, 10000);
    return () => clearInterval(interval);
  }, [refreshOrganization]);

  const handleCancel = async () => {
    await leaveOrganization();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
              <Clock className="h-7 w-7 text-amber-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-[DM_Sans]">
            Pending Approval
          </h1>
          <p className="text-muted-foreground text-sm">
            Your request to join <span className="font-semibold text-foreground">{organization?.name}</span> is waiting for admin approval.
          </p>
          <p className="text-xs text-muted-foreground">
            Signed in as {user?.email}
          </p>
        </div>

        <div className="space-y-3">
          <Button variant="outline" className="w-full" onClick={handleCancel}>
            Cancel Request
          </Button>
          <p className="text-center">
            <button
              type="button"
              onClick={signOut}
              className="text-sm text-muted-foreground hover:underline"
            >
              Sign out
            </button>
          </p>
        </div>

        <p className="text-[11px] text-muted-foreground/60">
          This page will automatically update when you're approved.
        </p>
      </div>
    </div>
  );
}
