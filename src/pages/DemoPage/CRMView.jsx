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
import IntegrationsPage from "@/pages/CRM/IntegrationsPage";
import SettingsPage from "@/pages/CRM/SettingsPage";
import TasksPage from "@/pages/CRM/TasksPage";
import { ChatProvider } from "@/contexts/ChatContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Users, Handshake, LayoutGrid, Bot, CheckSquare } from "lucide-react";
import { fetchLeads, createLead, updateLead } from "@/services/supabaseLeads";
import { fetchReferrers, updateReferrer } from "@/services/supabaseReferrers";
import { fetchTasks, createTask, updateTask, deleteTask } from "@/services/supabaseTasks";
import { useAuth } from "@/contexts/AuthContext";
import { useLeadAlerts } from "@/hooks/useLeadAlerts";
import { useCustomFields } from "@/hooks/useCustomFields";
import { usePipelineStages } from "@/hooks/usePipelineStages";
import { useTaskAutomation } from "@/hooks/useTaskAutomation";
import { supabase } from "@/lib/supabase";
import '../../crm.css';

const queryClient = new QueryClient();

function CRMView() {
  const { user, organization } = useAuth();
  const [currentPage, setCurrentPage] = useState('leads');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [leads, setLeads] = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [autoOpenLeadId, setAutoOpenLeadId] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const isMobile = useIsMobile();
  const orgId = organization?.id;
  const [orgSettings, setOrgSettings] = useState(null);

  // Save org settings to Supabase
  const saveOrgSettings = useCallback(async (updates) => {
    if (!orgId) return;
    const merged = { ...(orgSettings || {}), ...updates };
    setOrgSettings(merged);
    supabase.from('organizations').update({ settings: merged }).eq('id', orgId).then(({ error }) => {
      if (error) console.error('Failed to save org settings:', error);
    });
  }, [orgId, orgSettings]);

  const handleUpdateLeadDirect = useCallback(async (leadId, updates) => {
    try {
      const saved = await updateLead(leadId, updates);
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, ...saved } : l));
      return saved;
    } catch (err) {
      console.error('Failed to update lead:', err);
    }
  }, []);

  const { stages, stageLabel, stageProgress, addStage, removeStage, renameStage, reorderStages, resetToDefault: resetStagesToDefault } = usePipelineStages(orgSettings, saveOrgSettings, handleUpdateLeadDirect);

  const { rules: automationRules, addRule, removeRule: removeAutomationRule, updateRule: updateAutomationRule, toggleRule, resetToDefaults: resetAutomationDefaults, executeRules } = useTaskAutomation(orgSettings, saveOrgSettings, stages);

  const { customFields, addField, removeField, updateField: updateCustomField, setFields } = useCustomFields(
    orgSettings?.custom_fields || [],
    (fields) => saveOrgSettings({ custom_fields: fields })
  );

  const allAlerts = useLeadAlerts(leads, stages);
  const [dismissedAlertIds, setDismissedAlertIds] = useState(new Set());
  const alerts = allAlerts.filter(a => !dismissedAlertIds.has(a.id));
  const dismissAlert = useCallback((alertId) => {
    setDismissedAlertIds(prev => new Set([...prev, alertId]));
  }, []);
  const clearAllAlerts = useCallback(() => {
    setDismissedAlertIds(new Set(allAlerts.map(a => a.id)));
  }, [allAlerts]);

  // Handle Gmail OAuth callback redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (window.location.pathname === '/integrations' || params.get('gmail')) {
      setCurrentPage('integrations');
      // Clean up URL
      window.history.replaceState({}, '', '/');
    }
  }, []);

  useEffect(() => {
    if (!user || !orgId) return;
    setDataLoading(true);
    Promise.all([
      fetchLeads(orgId),
      fetchReferrers(orgId),
      fetchTasks(orgId),
      supabase.from('organizations').select('settings').eq('id', orgId).single(),
    ])
      .then(([fetchedLeads, fetchedReferrers, fetchedTasks, { data: orgRow }]) => {
        setLeads(fetchedLeads);
        setReferrers(fetchedReferrers);
        setTasks(fetchedTasks);
        const settings = orgRow?.settings || {};
        setOrgSettings(settings);
        if (settings.custom_fields) setFields(settings.custom_fields);
      })
      .catch(console.error)
      .finally(() => setDataLoading(false));
  }, [user?.id, orgId]);

  const handleAddLead = useCallback(async (lead, { autoOpen } = {}) => {
    try {
      const saved = await createLead(lead, orgId);
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
      // Auto-create tasks from automation rules
      const autoTasks = executeRules("new_lead", saved, stageLabel[saved.stage] || "");
      for (const task of autoTasks) {
        await handleAddTask(task);
      }
    } catch (err) {
      console.error('Failed to create lead:', err);
    }
  }, [referrers, orgId, executeRules, stageLabel]);

  const handleAutoOpenHandled = useCallback(() => {
    setAutoOpenLeadId(null);
  }, []);

  const handleReferrerAdded = useCallback((saved) => {
    setReferrers((prev) => [...prev, saved]);
  }, []);

  const handleAddTask = useCallback(async (taskData) => {
    try {
      const saved = await createTask(taskData, orgId);
      setTasks((prev) => [...prev, saved]);
      return saved;
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  }, [orgId]);

  const handleUpdateTask = useCallback(async (id, updates) => {
    try {
      const saved = await updateTask(id, updates);
      setTasks((prev) => prev.map((t) => t.id === id ? saved : t));
      return saved;
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  }, []);

  const handleDeleteTask = useCallback(async (id) => {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard leads={leads} alerts={alerts} tasks={tasks} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onNavigate={setCurrentPage} setAutoOpenLeadId={setAutoOpenLeadId} stages={stages} />;
      case 'leads':
        return (
          <LeadsPage
            leads={leads}
            setLeads={setLeads}
            onAddLead={handleAddLead}
            autoOpenLeadId={autoOpenLeadId}
            onAutoOpenHandled={handleAutoOpenHandled}
            referrers={referrers}
            setReferrers={setReferrers}
            onReferrerAdded={handleReferrerAdded}
            alerts={alerts}
            tasks={tasks}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            customFields={customFields}
            orgSettings={orgSettings}
            saveOrgSettings={saveOrgSettings}
            stages={stages}
            stageLabel={stageLabel}
            stageProgress={stageProgress}
            onAddStage={addStage}
            executeRules={executeRules}
          />
        );
      case 'referrers':
        return <ReferrersPage leads={leads} setLeads={setLeads} referrers={referrers} setReferrers={setReferrers} alerts={alerts} stages={stages} />;
      case 'tasks':
        return <TasksPage leads={leads} tasks={tasks} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} alerts={alerts} onNavigate={setCurrentPage} setAutoOpenLeadId={setAutoOpenLeadId} />;
      case 'tours':
        return <ToursPage alerts={alerts} />;
      case 'follow-up':
        return <FollowUpPage alerts={alerts} />;
      case 'chatbot':
        return <ChatbotPage alerts={alerts} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} />;
      case 'integrations':
        return <IntegrationsPage alerts={alerts} />;
      case 'settings':
        return <SettingsPage alerts={alerts} customFields={customFields} onAddField={addField} onRemoveField={removeField} onUpdateField={updateCustomField} orgSettings={orgSettings} saveOrgSettings={saveOrgSettings} stages={stages} stageLabel={stageLabel} onAddStage={addStage} onRemoveStage={removeStage} onRenameStage={renameStage} onReorderStages={reorderStages} onResetStages={resetStagesToDefault} leads={leads} automationRules={automationRules} onAddRule={addRule} onRemoveRule={removeAutomationRule} onUpdateRule={updateAutomationRule} onToggleRule={toggleRule} onResetAutomation={resetAutomationDefaults} />;
      default:
        return <Dashboard leads={leads} alerts={alerts} tasks={tasks} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onNavigate={setCurrentPage} setAutoOpenLeadId={setAutoOpenLeadId} stages={stages} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <NavigationProvider navigate={setCurrentPage} dismissAlert={dismissAlert} clearAllAlerts={clearAllAlerts}>
        <ChatProvider leads={leads} referrers={referrers} tasks={tasks}>
          <Toaster />
          <Sonner />
          <div className="flex h-screen overflow-hidden bg-background">
            {!isMobile && (
              <AppSidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                currentPage={currentPage}
                onNavigate={setCurrentPage}
                tasks={tasks}
              />
            )}
            <main className={`flex-1 overflow-auto ${isMobile ? "pb-16" : ""}`}>
              {dataLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                renderPage()
              )}
            </main>
            {isMobile && (
              <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-card py-2">
                {[
                  { key: "leads", label: "Leads", icon: Users },
                  { key: "referrers", label: "Referrers", icon: Handshake },
                  { key: "tasks", label: "Tasks", icon: CheckSquare },
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
        </NavigationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default CRMView;
