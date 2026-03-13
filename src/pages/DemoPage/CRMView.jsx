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
import { Users, Handshake, LayoutGrid, Bot } from "lucide-react";
import { fetchLeads, createLead, updateLead } from "@/services/supabaseLeads";
import { fetchReferrers, updateReferrer } from "@/services/supabaseReferrers";
import '../../crm.css';

const queryClient = new QueryClient();

function CRMView() {
  const [currentPage, setCurrentPage] = useState('leads');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [leads, setLeads] = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [autoOpenLeadId, setAutoOpenLeadId] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchLeads().then(setLeads).catch(console.error);
    fetchReferrers().then(setReferrers).catch(console.error);
  }, []);

  const handleAddLead = useCallback(async (lead, { autoOpen } = {}) => {
    try {
      const saved = await createLead(lead);
      setLeads((prev) => [...prev, saved]);
      if (autoOpen) {
        setAutoOpenLeadId(saved.id);
      }
      // If this lead came from a referrer, update the referrer's referredLeadIds
      if (lead.referrerId) {
        const referrer = referrers.find((r) => r.id === lead.referrerId);
        if (referrer) {
          const updated = { ...referrer, referredLeadIds: [...(referrer.referredLeadIds || []), saved.id] };
          await updateReferrer(referrer.id, updated);
          setReferrers((prev) => prev.map((r) => r.id === referrer.id ? updated : r));
        }
      }
    } catch (err) {
      console.error('Failed to create lead:', err);
    }
  }, [referrers]);

  const handleAutoOpenHandled = useCallback(() => {
    setAutoOpenLeadId(null);
  }, []);

  const renderPage = () => {
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
            referrers={referrers}
          />
        );
      case 'referrers':
        return <ReferrersPage leads={leads} referrers={referrers} setReferrers={setReferrers} />;
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
        <ChatProvider leads={leads} referrers={referrers}>
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
            <main className={`flex-1 overflow-auto ${isMobile ? "pb-16" : ""}`}>
              {renderPage()}
            </main>
            {isMobile && (
              <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-card py-2">
                {[
                  { key: "leads", label: "Leads", icon: Users },
                  { key: "referrers", label: "Referrers", icon: Handshake },
                  { key: "chatbot", label: "AI", icon: Bot },
                  { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setCurrentPage(key)}
                    className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-md transition-colors ${
                      currentPage === key ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium">{label}</span>
                  </button>
                ))}
              </nav>
            )}
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
