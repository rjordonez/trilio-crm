import { createContext, useContext, useState, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

const ChatContext = createContext(null);

export function ChatProvider({ leads, referrers, children }) {
  const allLeads = leads || [];
  const allReferrers = referrers || [];
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

  const contextRef = useRef({ leads: leadsContext, referrers: referrersContext });
  contextRef.current = { leads: leadsContext, referrers: referrersContext };

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({ leadsContext: contextRef.current.leads, referrersContext: contextRef.current.referrers }),
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
