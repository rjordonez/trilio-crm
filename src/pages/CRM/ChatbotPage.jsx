import { useRef, useEffect } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import { useIsMobile } from "@/hooks/use-mobile";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Bot, User, Square } from "lucide-react";
import Markdown from "react-markdown";

export default function ChatbotPage() {
  const messagesEndRef = useRef(null);
  const { messages, sendMessage, stop, status, input, setInput, leadsCount, referrersCount } =
    useChatContext();
  const isMobile = useIsMobile();

  const isLoading = status === 'streaming' || status === 'submitted';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="AI Assistant"
        subtitle="Ask questions about your leads and prospects"
      />

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className={`text-center ${isMobile ? "py-6" : "py-12"}`}>
              <Bot className={`${isMobile ? "h-10 w-10 mb-2" : "h-16 w-16 mb-4"} mx-auto text-muted-foreground`} />
              {!isMobile && (
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Welcome to your CRM AI Assistant
                </h3>
              )}
              <p className={`text-muted-foreground ${isMobile ? "text-xs mb-3" : "text-sm mb-4"}`}>
                {isMobile
                  ? `${leadsCount} leads · ${referrersCount} partners`
                  : `I have access to all ${leadsCount} leads and ${referrersCount} referral partners. Ask me anything!`
                }
              </p>
              <div className={`grid gap-2 ${isMobile ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2 gap-3"} max-w-2xl mx-auto`}>
                <button
                  onClick={() => sendMessage({ text: "Give me a summary of my pipeline" })}
                  className={`${isMobile ? "p-2 text-xs" : "p-3 text-sm"} text-left border rounded-lg hover:bg-muted transition-colors`}
                >
                  Pipeline summary
                </button>
                <button
                  onClick={() => sendMessage({ text: "Which leads need follow-up?" })}
                  className={`${isMobile ? "p-2 text-xs" : "p-3 text-sm"} text-left border rounded-lg hover:bg-muted transition-colors`}
                >
                  Needs follow-up
                </button>
                <button
                  onClick={() => sendMessage({ text: "Show me my referral partners and their performance" })}
                  className={`${isMobile ? "p-2 text-xs" : "p-3 text-sm"} text-left border rounded-lg hover:bg-muted transition-colors`}
                >
                  Referral partners
                </button>
                <button
                  onClick={() => sendMessage({ text: "What are the hot leads I should focus on today?" })}
                  className={`${isMobile ? "p-2 text-xs" : "p-3 text-sm"} text-left border rounded-lg hover:bg-muted transition-colors`}
                >
                  Today's priorities
                </button>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div
                className={`rounded-lg px-4 py-3 max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {message.role === "user" ? (
                  <p className="text-sm whitespace-pre-wrap">{message.parts.map((part) => part.type === 'text' ? part.text : '').join('')}</p>
                ) : (
                  <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                    <Markdown>{message.parts.map((part) => part.type === 'text' ? part.text : '').join('')}</Markdown>
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="rounded-lg px-4 py-3 bg-muted">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t p-4">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput("");
          }
        }} className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder="Ask about your leads, pipeline, or next steps..."
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim()) {
                    sendMessage({ text: input });
                    setInput("");
                  }
                }
              }}
            />
            {isLoading ? (
              <Button type="button" onClick={stop} size="icon" className="h-[60px] w-[60px]" variant="destructive">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={!input?.trim()} size="icon" className="h-[60px] w-[60px]">
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift + Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}
