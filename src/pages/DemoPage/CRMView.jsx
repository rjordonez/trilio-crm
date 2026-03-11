import { useState, useCallback } from 'react';
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
import { mockPipelineLeads } from "@/data/mockData";
import { useIsMobile } from "@/hooks/use-mobile";
import '../../crm.css';

const queryClient = new QueryClient();

function CRMView() {
  const [currentPage, setCurrentPage] = useState('leads');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [leads, setLeads] = useState(mockPipelineLeads);
  const [autoOpenLeadId, setAutoOpenLeadId] = useState(null);
  const isMobile = useIsMobile();

  const handleAddLead = useCallback((lead, { autoOpen } = {}) => {
    setLeads((prev) => [...prev, lead]);
    if (autoOpen) {
      setAutoOpenLeadId(lead.id);
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
        return <ReferrersPage />;
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
