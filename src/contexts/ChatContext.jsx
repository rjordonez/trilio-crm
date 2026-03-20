import { createContext, useContext, useState, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

const ChatContext = createContext(null);

export function ChatProvider({ leads, referrers, tasks, children }) {
  const allLeads = leads || [];
  const allReferrers = referrers || [];
  const allTasks = tasks || [];
  const [input, setInput] = useState("");

  const leadsContext = allLeads.map((lead) => ({
    name: lead.name,
    age: lead.age,
    stage: lead.stage,
    score: lead.score,
    careLevel: lead.careLevel,
    hoursPerDay: lead.hoursPerDay,
    budget: lead.budget,
    timeline: lead.timeline,
    facility: lead.facility,
    contactPerson: lead.contactPerson,
    contactRelation: lead.contactRelation,
    contactPhone: lead.contactPhone,
    contactEmail: lead.contactEmail,
    salesRep: lead.salesRep,
    nextActivity: lead.nextActivity,
    source: lead.source,
    lastContactDate: lead.lastContactDate,
    inquiryDate: lead.inquiryDate,
    initialContact: lead.initialContact,
    rejectedReason: lead.rejectedReason,
    intakeNote: lead.intakeNote,
  }));

  const referrersContext = allReferrers.map((r) => ({
    name: r.name,
    organization: r.organization,
    type: r.type,
    contactPerson: r.contactPerson,
    contactTitle: r.contactTitle,
    email: r.email,
    phone: r.phone,
    referralCount: r.referredLeadIds?.length || 0,
    status: r.status,
    notes: r.notes,
  }));

  const tasksContext = allTasks.filter((t) => t.status === "pending").map((t) => {
    const lead = allLeads.find((l) => l.id === t.lead_id);
    return {
      id: t.id,
      title: t.title,
      leadName: lead?.name || "Unknown",
      leadId: t.lead_id,
      dueDate: t.due_date,
      priority: t.priority,
      status: t.status,
    };
  });

  const contextRef = useRef({ leads: leadsContext, referrers: referrersContext, tasks: tasksContext });
  contextRef.current = { leads: leadsContext, referrers: referrersContext, tasks: tasksContext };

  const { messages, sendMessage, status, error, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({ leadsContext: contextRef.current.leads, referrersContext: contextRef.current.referrers, tasksContext: contextRef.current.tasks }),
    }),
    onFinish: (options) => {
      console.log("Message finished:", options.message);
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  return (
    <ChatContext.Provider
      value={{
        messages,
        sendMessage,
        stop,
        status,
        error,
        input,
        setInput,
        leadsCount: allLeads.length,
        referrersCount: allReferrers.length,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
