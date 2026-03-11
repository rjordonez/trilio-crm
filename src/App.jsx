import { AuthProvider, useAuth } from './contexts/AuthContext';
import CRMView from './pages/DemoPage/CRMView';
import LoginPage from './pages/Auth/LoginPage';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return user ? <CRMView /> : <LoginPage />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
