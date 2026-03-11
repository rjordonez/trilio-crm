import { createContext, useContext, useState, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { mockPipelineLeads } from "@/data/mockData";

const ChatContext = createContext(null);

export function ChatProvider({ leads, children }) {
  const allLeads = leads || mockPipelineLeads;
  const [input, setInput] = useState("");

  const leadsContext = allLeads.map((lead) => ({
    name: lead.name,
    stage: lead.stage,
    careLevel: lead.careLevel,
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
    intakeNote: lead.intakeNote,
    tourNotes: lead.tourNotes,
  }));

  // Keep a ref so the transport's body function always reads the latest leads
  const leadsContextRef = useRef(leadsContext);
  leadsContextRef.current = leadsContext;

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({ leadsContext: leadsContextRef.current }),
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
