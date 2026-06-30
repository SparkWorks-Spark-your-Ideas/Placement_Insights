import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendGlobalGeminiChat } from "@/lib/companyApi";
import { toast } from "sonner";

interface Message {
  sender: "user" | "bot";
  text: string;
  isError?: boolean;
}

/** 
 * Lightweight inline markdown renderer — supports **bold**, *italic*, 
 * bullet lists (- / *), numbered lists, and inline code.
 * No external dependency required.
 */
function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let key = 0;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    const items = listBuffer.map((item, i) => (
      <li key={i} className="ml-3">{renderInline(item)}</li>
    ));
    if (listType === "ol") {
      elements.push(<ol key={key++} className="list-decimal ml-2 my-1 space-y-0.5">{items}</ol>);
    } else {
      elements.push(<ul key={key++} className="list-disc ml-2 my-1 space-y-0.5">{items}</ul>);
    }
    listBuffer = [];
    listType = null;
  };

  const renderInline = (str: string): React.ReactNode[] => {
    // Process bold (**text**), italic (*text*), and inline code (`code`)
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let lastIndex = 0;
    let match;
    let i = 0;
    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.slice(lastIndex, match.index));
      }
      if (match[2]) {
        parts.push(<strong key={i++} className="font-semibold text-foreground">{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(<em key={i++} className="italic">{match[3]}</em>);
      } else if (match[4]) {
        parts.push(
          <code key={i++} className="bg-muted/60 border border-border/50 rounded px-1 py-0.5 text-[10px] font-mono">
            {match[4]}
          </code>
        );
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < str.length) parts.push(str.slice(lastIndex));
    return parts;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Bullet list: - item or * item
    const bulletMatch = line.match(/^[\s]*[-*]\s+(.*)/);
    if (bulletMatch) {
      if (listType !== "ul") { flushList(); listType = "ul"; }
      listBuffer.push(bulletMatch[1]);
      continue;
    }

    // Numbered list: 1. item
    const numberedMatch = line.match(/^[\s]*\d+\.\s+(.*)/);
    if (numberedMatch) {
      if (listType !== "ol") { flushList(); listType = "ol"; }
      listBuffer.push(numberedMatch[1]);
      continue;
    }

    flushList();

    // Heading: ### or ## or #
    const headingMatch = line.match(/^(#{1,3})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const cls = level === 1
        ? "text-sm font-bold text-foreground mt-1 mb-0.5"
        : level === 2
        ? "text-[11px] font-bold text-foreground mt-1 mb-0.5"
        : "text-[10px] font-semibold text-foreground/80 mt-0.5";
      elements.push(<p key={key++} className={cls}>{renderInline(headingMatch[2])}</p>);
      continue;
    }

    // Empty line — add a small spacer
    if (line.trim() === "") {
      elements.push(<div key={key++} className="h-1" />);
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={key++} className="leading-relaxed">{renderInline(line)}</p>
    );
  }

  flushList();
  return <div className="space-y-0.5 text-[11px]">{elements}</div>;
}

export function PlacementChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Hello! I am your **KITS Placement Navigator Assistant**.\n\nAsk me anything about:\n- Registered companies & categories\n- Open hiring drives & deadlines\n- CTC packages & eligibility\n- Placement statistics"
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput("");

    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setLoading(true);

    try {
      const chatHistory = messages.map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        text: m.text,
      }));

      const response = await sendGlobalGeminiChat({
        data: {
          message: userText,
          history: chatHistory,
        }
      });

      if (response.error) {
        // Parse the error cleanly — sometimes it's a JSON string
        let errorMsg = response.error;
        try {
          const parsed = JSON.parse(response.error);
          errorMsg = parsed?.error?.message || parsed?.message || response.error;
        } catch { /* not JSON, use raw */ }
        setMessages((prev) => [...prev, {
          sender: "bot",
          text: `⚠️ ${errorMsg}`,
          isError: true
        }]);
      } else {
        setMessages((prev) => [...prev, { sender: "bot", text: response.text ?? "" }]);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to reach the AI. Check the server console for details.");
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "⚠️ Could not connect to the AI server. Please check that `GEMINI_API_KEY` is set in your `.env` file.",
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none cursor-pointer"
        aria-label="Toggle Placement AI Chatbot"
      >
        {isOpen ? (
          <X className="h-6 w-6 animate-in spin-in-90 duration-200" />
        ) : (
          <MessageSquare className="h-6 w-6 animate-in zoom-in-50 duration-200" />
        )}
      </button>

      {/* Popup Chat Card Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 w-full max-w-sm h-[500px] flex flex-col border-none shadow-2xl bg-card text-card-foreground overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          
          {/* Accent Header Gradient */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
          
          <CardHeader className="p-4 pb-3 border-b border-border flex flex-row items-center gap-2.5 shrink-0 bg-slate-50/20">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 shrink-0">
              <Bot className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <CardTitle className="font-heading text-xs font-bold text-foreground truncate">
                Placement Navigator
              </CardTitle>
              <CardDescription className="text-[10px] text-muted-foreground truncate">
                AI assistant for companies, drives & stats
              </CardDescription>
            </div>
          </CardHeader>

          {/* Messages Area */}
          <CardContent className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/10 no-scrollbar">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
              >
                {msg.sender === "bot" && (
                  <span className="h-6 w-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center dark:bg-blue-950/40 dark:text-blue-400 shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </span>
                )}
                <div
                  className={`p-2.5 rounded-2xl max-w-[82%] select-text ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-tr-none ml-auto text-[11px] leading-relaxed"
                      : msg.isError
                      ? "bg-red-50 border border-red-200 text-red-700 rounded-tl-none dark:bg-red-950/20 dark:border-red-800 dark:text-red-400"
                      : "bg-muted border border-border/40 text-foreground rounded-tl-none"
                  }`}
                >
                  {msg.sender === "user" ? (
                    <span className="text-[11px] leading-relaxed">{msg.text}</span>
                  ) : (
                    <MarkdownText text={msg.text} />
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2 animate-pulse">
                <span className="h-6 w-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center dark:bg-blue-950/40 dark:text-blue-400 shrink-0">
                  <Bot className="h-3.5 w-3.5" />
                </span>
                <div className="p-2.5 rounded-2xl bg-muted border border-border/40 text-muted-foreground rounded-tl-none flex items-center gap-1.5 text-[10px] font-medium">
                  <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                  Scanning placement database...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Footer Input Area */}
          <CardFooter className="p-3 border-t border-border shrink-0 bg-background flex gap-2">
            <Input
              placeholder="Ask about companies or hiring drives..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              disabled={loading}
              className="flex-1 h-9 text-[11px] border-border bg-muted/20 focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500"
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shrink-0"
              aria-label="Send query"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
