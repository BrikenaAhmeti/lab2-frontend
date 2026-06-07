import { api } from '@/libs/axios/client';
import type { SignInPayload } from './authChat.types';
import type { AuthUser } from './types';

export type SignInResponse = {
  data: {
    data: {
      metadata: {
        chatId: string;
        accessToken: string;
        refreshToken: string;
        user: AuthUser;
      };
      chatData: unknown[];
    };
  };
};

export async function signInWithAgent(payload: SignInPayload) {
  const res = await api.auth.post<SignInResponse>(
    '/rebecca-agent-dom.controller/sign-in',
    payload
  );
  return res.data;
}
