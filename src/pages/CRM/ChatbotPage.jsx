import { useRef, useEffect } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Bot, User } from "lucide-react";
import Markdown from "react-markdown";

export default function ChatbotPage() {
  const messagesEndRef = useRef(null);
  const { messages, sendMessage, status, input, setInput, leadsCount } =
    useChatContext();

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
            <div className="text-center py-12">
              <Bot className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Welcome to your CRM AI Assistant
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                I have access to all {leadsCount} leads in your pipeline. Ask me anything!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto mt-6">
                <button
                  onClick={() => sendMessage({ text: "How many leads are in the inquiry stage?" })}
                  className="p-3 text-left text-sm border rounded-lg hover:bg-muted transition-colors"
                >
                  💡 How many leads are in the inquiry stage?
                </button>
                <button
                  onClick={() => sendMessage({ text: "Show me leads assigned to Sarah Johnson" })}
                  className="p-3 text-left text-sm border rounded-lg hover:bg-muted transition-colors"
                >
                  👥 Show me leads assigned to Sarah Johnson
                </button>
                <button
                  onClick={() => sendMessage({ text: "Which leads need follow-up this week?" })}
                  className="p-3 text-left text-sm border rounded-lg hover:bg-muted transition-colors"
                >
                  📅 Which leads need follow-up this week?
                </button>
                <button
                  onClick={() => sendMessage({ text: "Summarize the demo lead from Margaret Johnson" })}
                  className="p-3 text-left text-sm border rounded-lg hover:bg-muted transition-colors"
                >
                  ✨ Summarize the demo lead
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
            <Button type="submit" disabled={isLoading || !input?.trim()} size="icon" className="h-[60px] w-[60px]">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift + Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}
