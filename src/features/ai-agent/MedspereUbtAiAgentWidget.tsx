import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, ChevronDown, MessageCircle, Send, Sparkles, UserRound } from 'lucide-react';
import { io, type Socket } from 'socket.io-client';
import clsx from 'clsx';
import { useAppSelector } from '@/app/hooks';
import {
  selectAccessToken,
  selectAuthUser,
  selectIsAuthenticated,
} from '@/features/auth/authSelectors';
import type { AuthUser } from '@/features/auth/authSlice';
import { normalizeRoleName } from '@/features/auth/utils/roles';
import { env } from '@/config/env';
import Button from '@/ui/atoms/Button';

type AgentMessageRole = 'assistant' | 'user';

interface AgentMessage {
  id: string;
  role: AgentMessageRole;
  content: string;
}

interface DashboardHelperMessagePayload {
  sessionId?: string;
  message: string;
  role: string;
  portalTitle: string;
  patientId?: string;
}

interface DashboardHelperAck {
  ok: boolean;
  sessionId?: string;
  error?: string;
}

interface DashboardHelperAssistantMessage {
  sessionId: string;
  role: 'assistant';
  content: string;
  model?: string;
  timestamp?: string;
}

interface DashboardHelperTypingPayload {
  sessionId?: string;
  isTyping: boolean;
}

interface DashboardHelperErrorPayload {
  sessionId?: string;
  message: string;
}

interface DashboardHelperServerEvents {
  'dashboard-helper:ready': (payload: { userId: string; roles?: string[] }) => void;
  'dashboard-helper:typing': (payload: DashboardHelperTypingPayload) => void;
  'dashboard-helper:message': (payload: DashboardHelperAssistantMessage) => void;
  'dashboard-helper:error': (payload: DashboardHelperErrorPayload) => void;
  connect: () => void;
  connect_error: () => void;
  disconnect: () => void;
}

interface DashboardHelperClientEvents {
  'dashboard-helper:message': (
    payload: DashboardHelperMessagePayload,
    acknowledge?: (response: DashboardHelperAck) => void
  ) => void;
}

interface MedspereUbtAiAgentWidgetProps {
  portalTitle: string;
}

const replyTimeoutMs = 20000;

const fallbackSuggestedPrompts = [
  'Explain my dashboard',
  'What should I check first?',
  'Why can I not see Reports?',
];

const suggestedPromptsByRole: Record<string, string[]> = {
  'Super Admin': ['Why can I not see Roles?', 'Where do I check low stock?', "Where do I check today's revenue?"],
  Admin: ['Where do I check low stock?', "Where do I check today's revenue?", 'Where are reports?'],
  Receptionist: ['How do I check in a patient?', 'How do appointments start?', 'How do I find a patient?'],
  Doctor: ['What should I do first today?', 'Where do I create prescriptions?', 'Can AI fill my medical record?'],
  Nurse: ['Where do I enter triage notes?', 'Can I edit medical records?', 'Why can I not see patients from another department?'],
  'Lab Technician': ['Where do I enter results?', 'What happens after I complete results?', 'Can AI interpret results?'],
  Pharmacist: ['Where do I see pending prescriptions?', 'How do I mark a medication out of stock?', 'Can I change the prescription?'],
  Patient: ['How do I book an appointment?', 'Where are my lab results?', 'Where can I see my prescriptions?'],
};

const portalRoleByTitle: Record<string, string> = {
  'Admin Portal': 'Admin',
  'Doctor Portal': 'Doctor',
  'Nurse Portal': 'Nurse',
  'Lab Portal': 'Lab Technician',
  'Pharmacy Portal': 'Pharmacist',
  'Receptionist Portal': 'Receptionist',
  'Patient Portal': 'Patient',
};

function messageId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function createMessage(role: AgentMessageRole, content: string): AgentMessage {
  return {
    id: messageId(),
    role,
    content,
  };
}

function getUserRoles(user: AuthUser | null) {
  const roles = user?.roles?.length ? user.roles : user?.role ? [user.role] : [];
  return roles.map(normalizeRoleName);
}

function normalizeRoleKey(role: string) {
  return normalizeRoleName(role).trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function resolveDashboardHelperRole(user: AuthUser | null, portalTitle: string) {
  const userRoles = getUserRoles(user);
  const portalRole = portalRoleByTitle[portalTitle];

  if (portalTitle === 'Admin Portal') {
    if (userRoles.some((role) => normalizeRoleKey(role) === 'superadmin')) {
      return 'Super Admin';
    }

    if (userRoles.some((role) => normalizeRoleKey(role) === 'admin')) {
      return 'Admin';
    }
  }

  if (portalRole) {
    const portalRoleKey = normalizeRoleKey(portalRole);
    const matchingUserRole = userRoles.find((role) => normalizeRoleKey(role) === portalRoleKey);

    return matchingUserRole ?? portalRole;
  }

  return userRoles[0];
}

function getSuggestedPrompts(role?: string) {
  if (!role) return fallbackSuggestedPrompts;
  return suggestedPromptsByRole[role] ?? fallbackSuggestedPrompts;
}

export default function MedspereUbtAiAgentWidget({ portalTitle }: MedspereUbtAiAgentWidgetProps) {
  const accessToken = useAppSelector(selectAccessToken);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectAuthUser);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string>();
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>(() => [
    createMessage(
      'assistant',
      'Hi there. I am the MedSphere AI assistant. How can I help with your dashboard today?'
    ),
  ]);
  const messageListRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket<DashboardHelperServerEvents, DashboardHelperClientEvents> | null>(null);
  const sessionIdRef = useRef<string | undefined>(undefined);
  const isSendingRef = useRef(false);
  const replyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const portalLabel = useMemo(() => portalTitle.replace(' Portal', ''), [portalTitle]);
  const dashboardRole = useMemo(() => resolveDashboardHelperRole(user, portalTitle), [portalTitle, user]);
  const roleSuggestedPrompts = useMemo(() => getSuggestedPrompts(dashboardRole), [dashboardRole]);
  const showStarterPrompts = messages.length === 1 && messages[0]?.role === 'assistant';
  const canSend = input.trim().length > 0 && !isSending && isAuthenticated && Boolean(accessToken) && isConnected;

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    isSendingRef.current = isSending;
  }, [isSending]);

  useEffect(() => {
    return () => {
      clearReplyTimeout();
    };
  }, []);

  function clearReplyTimeout() {
    if (!replyTimeoutRef.current) return;
    clearTimeout(replyTimeoutRef.current);
    replyTimeoutRef.current = null;
  }

  function failPendingMessage(message: string) {
    clearReplyTimeout();
    setIsSending(false);
    setMessages((current) => {
      if (current.at(-1)?.role === 'assistant' && current.at(-1)?.content === message) {
        return current;
      }

      return [...current, createMessage('assistant', message)];
    });
  }

  useEffect(() => {
    if (!isOpen || !isAuthenticated || !accessToken) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      return;
    }

    const socket: Socket<DashboardHelperServerEvents, DashboardHelperClientEvents> = io(env.AI_SOCKET_URL, {
      auth: { token: accessToken },
      timeout: 10000,
      reconnectionAttempts: 4,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
      if (isSendingRef.current) {
        failPendingMessage('I could not connect to the AI helper socket. Please check that the AI service is running and try again.');
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      if (isSendingRef.current) {
        failPendingMessage('The AI helper socket disconnected before I could answer. Please try again.');
      }
    });

    socket.on('dashboard-helper:ready', () => {
      setIsConnected(true);
    });

    socket.on('dashboard-helper:typing', (payload) => {
      const activeSessionId = sessionIdRef.current;

      if (!payload.sessionId || !activeSessionId || payload.sessionId === activeSessionId) {
        setIsSending(payload.isTyping);
        if (!payload.isTyping) {
          clearReplyTimeout();
        }
      }
    });

    socket.on('dashboard-helper:message', (payload) => {
      clearReplyTimeout();
      setSessionId(payload.sessionId);
      setIsSending(false);
      setMessages((current) => [...current, createMessage('assistant', payload.content)]);
    });

    socket.on('dashboard-helper:error', (payload) => {
      clearReplyTimeout();
      if (payload.sessionId) {
        setSessionId(payload.sessionId);
      }
      setIsSending(false);
      setMessages((current) => [
        ...current,
        createMessage('assistant', payload.message || 'I could not reach the AI service right now.'),
      ]);
    });

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [accessToken, isAuthenticated, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const messageList = messageListRef.current;
    if (!messageList) return;

    if (typeof messageList.scrollTo === 'function') {
      messageList.scrollTo({
        top: messageList.scrollHeight,
        behavior: 'smooth',
      });
      return;
    }

    messageList.scrollTop = messageList.scrollHeight;
  }, [isOpen, messages, isSending]);

  function sendMessage(messageText: string) {
    const trimmed = messageText.trim();
    const socket = socketRef.current;

    if (!trimmed || isSending) return;

    if (!isAuthenticated || !accessToken || !socket) {
      setMessages((current) => [
        ...current,
        createMessage('assistant', 'Please sign in again so I can connect to the AI helper.'),
      ]);
      return;
    }

    if (!socket.connected || !isConnected) {
      setMessages((current) => [
        ...current,
        createMessage('assistant', 'The AI helper socket is still connecting. Please try again in a moment.'),
      ]);
      return;
    }

    if (!dashboardRole) {
      setMessages((current) => [
        ...current,
        createMessage('assistant', 'I need your current role before I can answer dashboard questions.'),
      ]);
      return;
    }

    setInput('');
    setIsSending(true);
    setMessages((current) => [...current, createMessage('user', trimmed)]);
    clearReplyTimeout();
    replyTimeoutRef.current = setTimeout(() => {
      failPendingMessage('The AI helper did not return an answer in time. Please try again.');
    }, replyTimeoutMs);

    socket.emit(
      'dashboard-helper:message',
      {
        sessionId,
        message: trimmed,
        role: dashboardRole,
        portalTitle,
        patientId: user?.patientId ?? user?.patientProfileId,
      },
      (response) => {
        if (response.sessionId) {
          setSessionId(response.sessionId);
        }

        if (!response.ok) {
          failPendingMessage(response.error || 'The AI helper could not answer that message.');
        }
      }
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[368px]">
      {isOpen ? (
        <section
          aria-label="MedSphere UBT AI Agent"
          className="flex h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-lg border border-white/20 bg-card shadow-2xl ring-1 ring-primary/10 sm:h-[min(620px,calc(100dvh-3rem))]"
        >
          <header className="relative overflow-hidden bg-[linear-gradient(135deg,#2437f2_0%,#0bbce8_100%)] px-5 pb-10 pt-5 text-white">
            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3.5">
                <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white/95 p-1 shadow-soft">
                  <img
                    src="/medsphere.png"
                    alt=""
                    className="h-full w-full rounded-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className={clsx('absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-white', isConnected ? 'bg-success' : 'bg-warning')} />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold">Chat with us</h2>
                  <p className="mt-1 truncate text-sm text-white/78">{portalLabel} support assistant</p>
                </div>
              </div>
              <button
                type="button"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white/88 transition hover:bg-white/12"
                aria-label="Minimize MedSphere UBT AI Agent"
                title="Minimize"
                onClick={() => setIsOpen(false)}
              >
                <ChevronDown className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <p className="relative z-10 mt-5 text-sm text-white/82">
              We typically reply in a few minutes.
            </p>
            <div className="absolute inset-x-0 -bottom-6 h-14 rounded-[50%] bg-card" />
          </header>

          <div
            ref={messageListRef}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-card px-5 pb-4 pt-5"
          >
            {messages.map((message, index) => {
              const starterMessage = showStarterPrompts && index === 0 && message.role === 'assistant';

              return (
                <div key={message.id}>
                  <div
                    className={clsx('flex items-end gap-2', message.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    {message.role === 'assistant' ? (
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                        <Bot className="h-4 w-4" aria-hidden="true" />
                      </span>
                    ) : null}
                    <p
                      className={clsx(
                        'max-w-[84%] whitespace-pre-wrap break-words rounded-lg px-3.5 py-2.5 text-sm leading-5',
                        message.role === 'user'
                          ? 'bg-[#246bff] text-white shadow-soft'
                          : 'bg-[#f0f3f8] text-slate-700 ring-1 ring-slate-200'
                      )}
                    >
                      {message.content}
                    </p>
                    {message.role === 'user' ? (
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface text-muted">
                        <UserRound className="h-4 w-4" aria-hidden="true" />
                      </span>
                    ) : null}
                  </div>
                  {starterMessage ? (
                    <div className="ml-10 mt-0 max-w-[84%] overflow-hidden rounded-b-lg border border-slate-200 bg-white shadow-soft">
                      {roleSuggestedPrompts.slice(0, 3).map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          className="block w-full border-t border-slate-200 px-3 py-2 text-center text-sm font-medium text-[#1387ff] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isSending || !isConnected}
                          onClick={() => sendMessage(prompt)}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
            {isSending && (
              <div className="flex items-end gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="flex items-center gap-1 rounded-lg bg-[#f0f3f8] px-3 py-3 text-slate-500 ring-1 ring-slate-200">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
                  <span className="sr-only">Typing...</span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-white px-5 py-4">
            <form className="flex items-end gap-2" onSubmit={handleSubmit}>
              <label htmlFor="medspere-ai-agent-input" className="sr-only">
                Ask MedSphere UBT AI Agent
              </label>
              <textarea
                id="medspere-ai-agent-input"
                value={input}
                rows={1}
                className="max-h-28 min-h-11 flex-1 resize-none border-0 bg-transparent py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                placeholder="Type your message..."
                onChange={(event) => setInput(event.target.value)}
              />
              <Button
                type="submit"
                size="sm"
                className="h-12 w-12 shrink-0 rounded-full bg-[#1463ff] p-0 shadow-lg hover:bg-[#0f55dd]"
                disabled={!canSend}
                aria-label="Send message to MedSphere UBT AI Agent"
                title="Send"
              >
                <Send className="h-5 w-5" aria-hidden="true" />
              </Button>
            </form>
            <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-normal text-slate-300">
              Powered by MedSphere
            </p>
          </div>
        </section>
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            className="grid h-14 w-14 place-items-center rounded-full bg-[#1463ff] text-white shadow-2xl ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-[#0f55dd]"
            aria-label="Open MedSphere UBT AI Agent"
            title="Open AI assistant"
            onClick={() => setIsOpen((current) => !current)}
          >
            <MessageCircle className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
