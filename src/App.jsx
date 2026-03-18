import { AuthProvider, useAuth } from './contexts/AuthContext';
import CRMView from './pages/DemoPage/CRMView';
import LoginPage from './pages/Auth/LoginPage';
import OrgGatePage from './pages/Auth/OrgGatePage';
import PendingApprovalPage from './pages/Auth/PendingApprovalPage';

function AppContent() {
  const { user, organization, membershipStatus, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <LoginPage />;
  if (membershipStatus === 'pending') return <PendingApprovalPage />;
  if (!organization || membershipStatus !== 'active') return <OrgGatePage />;
  return <CRMView />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
