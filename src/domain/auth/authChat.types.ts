export type ChatFlow = 'sign-in';

export type AgentStage = string; // keep flexible (backend stages)
export type UserMessageType = 'pending' | 'error' | 'sent';

export type ChatMessage =
  | {
      _id: string;
      agent: {
        message: string;
        stage?: AgentStage;
        sort?: number;
        flow?: ChatFlow;
      };
    }
  | {
      _id: string;
      user: {
        message: string;
        type?: UserMessageType;
        stage?: AgentStage;
        sort?: number;
        flow?: ChatFlow;
      };
    };

export type AuthChatState = {
  chatId: string | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
};

export type SignInPayload = {
  dashboard: 'Leo';
  chatId?: string;
  chatData: any[];
};

export const isAgentMessage = (
  m: ChatMessage
): m is Extract<ChatMessage, { agent: any }> => 'agent' in m;

export const isUserMessage = (
  m: ChatMessage
): m is Extract<ChatMessage, { user: any }> => 'user' in m;

