"use client";

import * as React from "react";
import { Box, IconButton, CircularProgress } from "@mui/material";
import {
  MessageCircle,
  X,
  Send,
  TrendingUp,
  Sparkles,
  RotateCcw,
  History,
  ChevronLeft,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/lib/http";
import { TOOL_INVALIDATIONS } from "@/lib/agent-invalidation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  text: string;
  actions?: { name: string; args: Record<string, any> }[];
}

interface AgentReply {
  text: string;
  actions: Message["actions"];
  conversationId: number;
}

interface ConversationSummary {
  id: number;
  title: string | null;
  updatedAt: string;
}

// ─── API call ─────────────────────────────────────────────────────────────────

async function sendMessage(message: string, conversationId: number | null) {
  const { data } = await http.post<{
    success: boolean;
    data: AgentReply;
  }>("/agent/chat", {
    message,
    // Only include when we have one — first message creates the conversation
    ...(conversationId ? { conversationId } : {}),
  });
  return data;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  getDashboardSummary: "Checked your dashboard",
  getTransactions: "Fetched transactions",
  addTransaction: "Created a transaction",
  getAccounts: "Checked your accounts",
  createAccount: "Created an account",
  rememberFact: "Saved to memory",
  getBudget: "Checked your budget",
upsertBudget: "Updated your budget",
deleteBudget: "Deleted your budget",
};

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  text: "Hi! 👋 I'm your Pocket Wallet assistant. Ask me about your spending, transactions, or anything about your finances.",
};

function ActionChip({ name }: { name: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.04em",
        color: "#818cf8",
        background: "rgba(99,102,241,0.12)",
        borderRadius: 20,
        padding: "2px 8px",
        marginBottom: 4,
      }}
    >
      <Sparkles size={10} />
      {ACTION_LABELS[name] ?? name}
    </span>
  );
}

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        mb: 1.5,
      }}
    >
      {!isUser && msg.actions && msg.actions.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 0.5 }}>
          {msg.actions.map((a, i) => (
            <ActionChip key={i} name={a.name} />
          ))}
        </Box>
      )}
      <Box
        sx={{
          maxWidth: "85%",
          px: 1.5,
          py: 1,
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser
            ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
            : "#1e293b",
          color: "#fff",
          fontSize: 13,
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {msg.text}
      </Box>
    </Box>
  );
}

function TypingIndicator() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        px: 1.5,
        py: 1,
        mb: 1.5,
      }}
    >
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#475569",
            animation: "bounce 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
            "@keyframes bounce": {
              "0%, 60%, 100%": { transform: "translateY(0)" },
              "30%": { transform: "translateY(-4px)" },
            },
          }}
        />
      ))}
    </Box>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIAssistant() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = React.useState("");

  // The only conversation state the server needs — a number, never an array
  const [conversationId, setConversationId] = React.useState<number | null>(null);

  // History view state
  const [view, setView] = React.useState<"chat" | "history">("chat");
  const [conversations, setConversations] = React.useState<ConversationSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState(false);

  const bottomRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  // ── Mutation for sending messages ──
  const { mutate, isPending } = useMutation({
    mutationFn: ({ message }: { message: string }) =>
      sendMessage(message, conversationId),

    onSuccess: (data) => {
      const { text, actions, conversationId: id } = data.data;
      setConversationId(id);
      setMessages((prev) => [...prev, { role: "assistant", text, actions }]);

      // Invalidate queries touched by any mutating tool the agent called this turn
      const keysToInvalidate = new Set<string>();
      for (const action of actions ?? []) {
        const affected = TOOL_INVALIDATIONS[action.name];
        if (!affected) continue;
        for (const key of affected) keysToInvalidate.add(JSON.stringify(key));
      }
      for (const serialized of keysToInvalidate) {
        queryClient.invalidateQueries({ queryKey: JSON.parse(serialized) });
      }
    },

    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Something went wrong. Please try again." },
      ]);
    },
  });

  // ── Scroll to bottom whenever new messages land ──
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Focus the input when the panel opens ──
  React.useEffect(() => {
    if (open && view === "chat") setTimeout(() => inputRef.current?.focus(), 100);
  }, [open, view]);

  // ── Resume the latest conversation on first mount ──
  React.useEffect(() => {
    http
      .get<{ success: boolean; data: ConversationSummary[] }>("/agent/conversations")
      .then(async ({ data }) => {
        const latest = data.data[0]; // sorted by updatedAt desc
        if (!latest) return; // no conversations yet — fresh start

        const { data: msgs } = await http.get<{
          success: boolean;
          data: Message[];
        }>(`/agent/conversations/${latest.id}/messages`);

        setConversationId(latest.id);
        if (msgs.data.length) setMessages([WELCOME_MESSAGE, ...msgs.data]);
      })
      .catch(() => {}); // resume is best-effort — worst case, a fresh chat
  }, []);

  // ── History panel data loading ──
  const loadConversations = React.useCallback(async () => {
    setLoadingHistory(true);
    try {
      const { data } = await http.get<{
        success: boolean;
        data: ConversationSummary[];
      }>("/agent/conversations");
      setConversations(data.data);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const openConversation = async (id: number) => {
    try {
      const { data } = await http.get<{ success: boolean; data: Message[] }>(
        `/agent/conversations/${id}/messages`
      );
      setConversationId(id);
      setMessages([WELCOME_MESSAGE, ...data.data]);
      setView("chat");
    } catch {
      // fail silently — user can retry
    }
  };

  const openHistory = () => {
    loadConversations();
    setView("history");
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isPending) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    mutate({ message: trimmed });
  };

  const handleNewChat = () => {
    setConversationId(null);
    setMessages([WELCOME_MESSAGE]);
    setView("chat");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* ── Floating button ── */}
      <Box
        sx={{
          position: "fixed",
          bottom: 28,
          right: 28,
          zIndex: 1300,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 1.5,
        }}
      >
        {!open && (
          <Box
            sx={{
              bgcolor: "#0f172a",
              color: "#fff",
              fontSize: 12,
              fontWeight: 500,
              px: 1.5,
              py: 0.75,
              borderRadius: 2,
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              whiteSpace: "nowrap",
            }}
          >
            Ask AI ✨
          </Box>
        )}

        <IconButton
          onClick={() => setOpen((o) => !o)}
          sx={{
            width: 52,
            height: 52,
            background: open
              ? "#1e293b"
              : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
            "&:hover": {
              background: open
                ? "#334155"
                : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            },
            transition: "all 0.2s ease",
          }}
        >
          {open ? <X size={22} /> : <MessageCircle size={22} />}
        </IconButton>
      </Box>

      {/* ── Chat panel ── */}
      <Box
        sx={{
          position: "fixed",
          bottom: 96,
          right: 28,
          width: { xs: "calc(100vw - 32px)", sm: 360 },
          height: 480,
          zIndex: 1300,
          display: "flex",
          flexDirection: "column",
          bgcolor: "#0f172a",
          borderRadius: 3,
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
          border: "1px solid #1e293b",
          overflow: "hidden",
          opacity: open ? 1 : 0,
          transform: open
            ? "translateY(0) scale(1)"
            : "translateY(16px) scale(0.97)",
          pointerEvents: open ? "all" : "none",
          transition: "opacity 0.2s ease, transform 0.2s ease",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2,
            py: 1.75,
            borderBottom: "1px solid #1e293b",
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              flexShrink: 0,
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TrendingUp size={16} color="white" />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {view === "history" ? "Conversation history" : "Pocket Wallet AI"}
            </p>
            {view === "chat" && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: "#22c55e",
                  }}
                />
                <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>Online</p>
              </Box>
            )}
          </Box>

          {/* Header actions swap based on view */}
          {view === "history" ? (
            <IconButton
              size="small"
              onClick={() => setView("chat")}
              title="Back to chat"
              sx={{ color: "#475569", "&:hover": { color: "#fff" } }}
            >
              <ChevronLeft size={16} />
            </IconButton>
          ) : (
            <>
              <IconButton
                size="small"
                onClick={openHistory}
                title="Conversation history"
                sx={{ color: "#475569", "&:hover": { color: "#fff" } }}
              >
                <History size={15} />
              </IconButton>
              {conversationId !== null && (
                <IconButton
                  size="small"
                  onClick={handleNewChat}
                  title="Start a new chat"
                  sx={{ color: "#475569", "&:hover": { color: "#fff" } }}
                >
                  <RotateCcw size={15} />
                </IconButton>
              )}
            </>
          )}

          <IconButton
            size="small"
            onClick={() => setOpen(false)}
            sx={{ color: "#475569", "&:hover": { color: "#fff" } }}
          >
            <X size={16} />
          </IconButton>
        </Box>

        {/* ── Chat view ── */}
        {view === "chat" && (
          <>
            {/* Messages */}
            <Box
              sx={{
                flexGrow: 1,
                overflowY: "auto",
                px: 2,
                py: 2,
                display: "flex",
                flexDirection: "column",
                "&::-webkit-scrollbar": { width: 4 },
                "&::-webkit-scrollbar-track": { background: "transparent" },
                "&::-webkit-scrollbar-thumb": {
                  background: "#1e293b",
                  borderRadius: 2,
                },
              }}
            >
              {messages.map((msg, i) => (
                <ChatBubble key={i} msg={msg} />
              ))}
              {isPending && <TypingIndicator />}
              <div ref={bottomRef} />
            </Box>

            {/* Suggested prompts — only shown with no real conversation yet */}
            {messages.length === 1 && !isPending && (
              <Box
                sx={{
                  px: 2,
                  pb: 1.5,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0.75,
                }}
              >
                {[
                  "What's my biggest expense?",
                  "How am I doing this month?",
                  "Add a ₦2,000 food expense",
                ].map((prompt) => (
                  <Box
                    key={prompt}
                    onClick={() => {
                      setInput(prompt);
                      inputRef.current?.focus();
                    }}
                    sx={{
                      fontSize: 11,
                      color: "#94a3b8",
                      border: "1px solid #1e293b",
                      borderRadius: 20,
                      px: 1.25,
                      py: 0.5,
                      cursor: "pointer",
                      "&:hover": { borderColor: "#6366f1", color: "#818cf8" },
                      transition: "all 0.15s",
                    }}
                  >
                    {prompt}
                  </Box>
                ))}
              </Box>
            )}

            {/* Input */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 1.5,
                borderTop: "1px solid #1e293b",
                flexShrink: 0,
              }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your finances…"
                disabled={isPending}
                style={{
                  flexGrow: 1,
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: 20,
                  padding: "8px 14px",
                  fontSize: 13,
                  color: "#fff",
                  outline: "none",
                  fontFamily: "inherit",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "#334155")}
              />
              <IconButton
                onClick={handleSend}
                disabled={!input.trim() || isPending}
                sx={{
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                  background:
                    input.trim() && !isPending
                      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                      : "#1e293b",
                  color: "#fff",
                  "&:hover": {
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  },
                  "&.Mui-disabled": {
                    background: "#1e293b",
                    color: "#334155",
                  },
                  transition: "all 0.15s",
                }}
              >
                {isPending ? (
                  <CircularProgress size={16} sx={{ color: "#6366f1" }} />
                ) : (
                  <Send size={16} />
                )}
              </IconButton>
            </Box>
          </>
        )}

        {/* ── History view ── */}
        {view === "history" && (
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              px: 1,
              py: 1,
              "&::-webkit-scrollbar": { width: 4 },
              "&::-webkit-scrollbar-track": { background: "transparent" },
              "&::-webkit-scrollbar-thumb": {
                background: "#1e293b",
                borderRadius: 2,
              },
            }}
          >
            {loadingHistory ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={20} sx={{ color: "#6366f1" }} />
              </Box>
            ) : conversations.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: 12,
                  py: 4,
                }}
              >
                No previous conversations yet.
              </Box>
            ) : (
              conversations.map((c) => (
                <Box
                  key={c.id}
                  onClick={() => openConversation(c.id)}
                  sx={{
                    px: 1.5,
                    py: 1.25,
                    mb: 0.5,
                    borderRadius: 2,
                    cursor: "pointer",
                    background:
                      c.id === conversationId
                        ? "rgba(99,102,241,0.12)"
                        : "transparent",
                    border: "1px solid transparent",
                    "&:hover": {
                      background: "#1e293b",
                      borderColor: "#334155",
                    },
                    transition: "all 0.15s",
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#e2e8f0",
                      margin: 0,
                      lineHeight: 1.3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.title ?? "Untitled conversation"}
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      color: "#64748b",
                      margin: "2px 0 0",
                    }}
                  >
                    {new Date(c.updatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </Box>
              ))
            )}
          </Box>
        )}
      </Box>
    </>
  );
}