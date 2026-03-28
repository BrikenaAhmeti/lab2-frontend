import { api } from '@/libs/axios/client';
import type { SignInPayload } from './authChat.types';

export type SignInResponse = {
  data: {
    data: {
      metadata: {
        chatId: string;
        accessToken: string;
        refreshToken: string;
        user: any;
      };
      chatData: any;
    };
  };
};

export async function signInWithAgent(payload: SignInPayload) {
  const res = await api.core.post<SignInResponse>(
    '/rebecca-agent-dom.controller/sign-in',
    payload
  );
  return res.data;
}
