import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import '../../crm.css';

export default function OrgGatePage() {
  const { user, requestToJoinOrganization, createOrganization, signOut } = useAuth();
  const [mode, setMode] = useState('join'); // 'join' | 'create'
  const [orgCode, setOrgCode] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!orgCode.trim()) { setError('Please enter an organization code'); return; }
    setError('');
    setLoading(true);
    const { error } = await requestToJoinOrganization(orgCode.trim());
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) { setError('Please enter an organization name'); return; }
    setError('');
    setLoading(true);
    const { error } = await createOrganization(orgName.trim());
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-[DM_Sans]">
            Trilio
          </h1>
          <p className="text-muted-foreground text-sm">
            Join an organization or create your own
          </p>
          <p className="text-xs text-muted-foreground">
            Signed in as {user?.email}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => { setMode('join'); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === 'join' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
            }`}
          >
            Join Existing
          </button>
          <button
            type="button"
            onClick={() => { setMode('create'); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === 'create' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
            }`}
          >
            Create New
          </button>
        </div>

        {mode === 'join' ? (
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgCode">Organization Code</Label>
              <Input
                id="orgCode"
                type="text"
                value={orgCode}
                onChange={(e) => setOrgCode(e.target.value)}
                placeholder="Enter code from your admin"
                required
              />
              <p className="text-xs text-muted-foreground">
                Ask your organization admin for the invite code.
                Your request will need to be approved.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Requesting...' : 'Request to Join'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. XYZ Care"
                required
              />
              <p className="text-xs text-muted-foreground">
                You'll be the owner. An invite code will be generated for your team.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Organization'}
            </Button>
          </form>
        )}

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
    </div>
  );
}
