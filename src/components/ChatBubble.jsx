import { useState, useRef, useEffect } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageCircle,
  X,
  Maximize2,
  Send,
  Loader2,
  Bot,
  User,
} from "lucide-react";
import Markdown from "react-markdown";

export default function ChatBubble({ currentPage, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [greetingDismissed, setGreetingDismissed] = useState(false);
  const { messages, sendMessage, status, input, setInput } = useChatContext();
  const messagesEndRef = useRef(null);

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Show greeting after a short delay
  useEffect(() => {
    if (greetingDismissed || isOpen) return;
    const timer = setTimeout(() => setShowGreeting(true), 1500);
    return () => clearTimeout(timer);
  }, [greetingDismissed, isOpen]);

  // Auto-hide greeting after 1 minute
  useEffect(() => {
    if (!showGreeting) return;
    const timer = setTimeout(() => {
      setShowGreeting(false);
    }, 60000);
    return () => clearTimeout(timer);
  }, [showGreeting]);

  if (currentPage === "chatbot") return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        sendMessage({ text: input });
        setInput("");
      }
    }
  };

  const handleExpand = () => {
    setIsOpen(false);
    onNavigate("chatbot");
  };

  return (
    <>
      {/* Mini popup window */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-[400px] h-[500px] bg-background border rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">AI Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleExpand}
                title="Open full page"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Ask me anything about your leads!
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
                    <Bot className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`rounded-lg px-3 py-2 max-w-[80%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="text-xs whitespace-pre-wrap">{message.parts.map((part) => part.type === "text" ? part.text : "").join("")}</p>
                  ) : (
                    <div className="text-xs prose prose-xs dark:prose-invert max-w-none">
                      <Markdown>{message.parts.map((part) => part.type === "text" ? part.text : "").join("")}</Markdown>
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Bot className="h-3 w-3 text-primary-foreground" />
                </div>
                <div className="rounded-lg px-3 py-2 bg-muted">
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t p-3">
            <form onSubmit={handleSubmit}>
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  placeholder="Ask about your leads..."
                  className="min-h-[40px] max-h-[80px] resize-none text-xs"
                  onKeyDown={handleKeyDown}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input?.trim()}
                  size="icon"
                  className="h-[40px] w-[40px] shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Greeting tooltip */}
      {showGreeting && !isOpen && (
        <div
          className="fixed bottom-[88px] right-6 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300"
        >
          <div className="relative bg-background border border-border rounded-xl shadow-lg px-4 py-3 max-w-[220px]">
            <button
              onClick={() => { setShowGreeting(false); setGreetingDismissed(true); }}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-muted/80"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
            <p className="text-sm font-medium text-foreground">Hi, I'm Trilio, your AI sale assistant.</p>
            <p className="text-xs text-muted-foreground mt-0.5">Ask me anything!</p>
          </div>
          <div className="w-3 h-3 bg-background border-r border-b border-border rotate-45 absolute -bottom-1.5 right-8" />
        </div>
      )}

      {/* Floating bubble button */}
      <button
        onClick={() => { setIsOpen(!isOpen); setShowGreeting(false); setGreetingDismissed(true); }}
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center ${
          !isOpen ? "animate-bounce" : ""
        }`}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </>
  );
}
