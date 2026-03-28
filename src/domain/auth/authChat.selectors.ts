import type { RootState } from '@/app/store';
import type { ChatMessage } from './authChat.types';
import { isAgentMessage } from './authChat.types';

// 1) Base selectors (direct)
export const selectAuthChat = (s: RootState) => s.authChat;
export const selectAuthChatMessages = (s: RootState) => s.authChat.messages;
export const selectAuthChatLoading = (s: RootState) => s.authChat.loading;
export const selectAuthChatError = (s: RootState) => s.authChat.error;
export const selectAuthChatId = (s: RootState) => s.authChat.chatId;

// 2) Derived selectors (computed)
// last agent message (used for stage/sort/flow)
export const selectLastAgent = (s: RootState) =>
  [...s.authChat.messages].reverse().find(isAgentMessage)?.agent;

// last agent stage (useful to know what step we are in)
export const selectLastAgentStage = (s: RootState) =>
  selectLastAgent(s)?.stage ?? null;

// authenticated flag (based on stage or token)
export const selectIsAuthenticatedByChat = (s: RootState) =>
  s.authChat.messages.some((m: ChatMessage) => isAgentMessage(m) && m.agent.stage === 'authenticated');

// token-based auth
export const selectHasAccessToken = (s: RootState) =>
  !!s.auth.tokens?.accessToken;

// final “is authenticated” (best to use in routing/pages)
export const selectIsAuthenticated = (s: RootState) =>
  selectHasAccessToken(s) || selectIsAuthenticatedByChat(s);
