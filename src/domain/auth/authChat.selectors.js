import { isAgentMessage } from './authChat.types';
// 1) Base selectors (direct)
export const selectAuthChat = (s) => s.authChat;
export const selectAuthChatMessages = (s) => s.authChat.messages;
export const selectAuthChatLoading = (s) => s.authChat.loading;
export const selectAuthChatError = (s) => s.authChat.error;
export const selectAuthChatId = (s) => s.authChat.chatId;
// 2) Derived selectors (computed)
// last agent message (used for stage/sort/flow)
export const selectLastAgent = (s) => [...s.authChat.messages].reverse().find(isAgentMessage)?.agent;
// last agent stage (useful to know what step we are in)
export const selectLastAgentStage = (s) => selectLastAgent(s)?.stage ?? null;
// authenticated flag (based on stage or token)
export const selectIsAuthenticatedByChat = (s) => s.authChat.messages.some((m) => isAgentMessage(m) && m.agent.stage === 'authenticated');
// token-based auth
export const selectHasAccessToken = (s) => !!s.auth.tokens?.accessToken;
// final “is authenticated” (best to use in routing/pages)
export const selectIsAuthenticated = (s) => selectHasAccessToken(s) || selectIsAuthenticatedByChat(s);
