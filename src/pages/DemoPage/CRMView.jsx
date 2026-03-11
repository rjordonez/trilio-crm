import { useState, useCallback, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import AppSidebar from "@/components/AppSidebar";
import ChatBubble from "@/components/ChatBubble";
import Dashboard from "@/pages/CRM/Dashboard";
import LeadsPage from "@/pages/CRM/LeadsPage";
import ToursPage from "@/pages/CRM/ToursPage";
import FollowUpPage from "@/pages/CRM/FollowUpPage";
import ChatbotPage from "@/pages/CRM/ChatbotPage";
import ReferrersPage from "@/pages/CRM/ReferrersPage";
import { ChatProvider } from "@/contexts/ChatContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchLeads, createLead, updateLead } from "@/services/supabaseLeads";
import '../../crm.css';

const queryClient = new QueryClient();

function CRMView() {
  const [currentPage, setCurrentPage] = useState('leads');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [leads, setLeads] = useState([]);
  const [autoOpenLeadId, setAutoOpenLeadId] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchLeads().then(setLeads).catch(console.error);
  }, []);

  const handleAddLead = useCallback(async (lead, { autoOpen } = {}) => {
    try {
      const saved = await createLead(lead);
      setLeads((prev) => [...prev, saved]);
      if (autoOpen) {
        setAutoOpenLeadId(saved.id);
      }
    } catch (err) {
      console.error('Failed to create lead:', err);
    }
  }, []);

  const handleAutoOpenHandled = useCallback(() => {
    setAutoOpenLeadId(null);
  }, []);

  const renderPage = () => {
    if (isMobile) {
      return (
        <LeadsPage
          leads={leads}
          setLeads={setLeads}
          onAddLead={handleAddLead}
          autoOpenLeadId={autoOpenLeadId}
          onAutoOpenHandled={handleAutoOpenHandled}
        />
      );
    }
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'leads':
        return (
          <LeadsPage
            leads={leads}
            setLeads={setLeads}
            onAddLead={handleAddLead}
            autoOpenLeadId={autoOpenLeadId}
            onAutoOpenHandled={handleAutoOpenHandled}
          />
        );
      case 'referrers':
        return <ReferrersPage leads={leads} />;
      case 'tours':
        return <ToursPage />;
      case 'follow-up':
        return <FollowUpPage />;
      case 'chatbot':
        return <ChatbotPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ChatProvider leads={leads}>
          <Toaster />
          <Sonner />
          <div className="flex h-screen overflow-hidden bg-background">
            {!isMobile && (
              <AppSidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                currentPage={currentPage}
                onNavigate={setCurrentPage}
              />
            )}
            <main className="flex-1 overflow-auto">
              {renderPage()}
            </main>
          </div>
          {!isMobile && (
            <ChatBubble currentPage={currentPage} onNavigate={setCurrentPage} />
          )}
        </ChatProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default CRMView;
