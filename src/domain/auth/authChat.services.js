import { api } from '@/libs/axios/client';
export async function signInWithAgent(payload) {
    const res = await api.core.post('/rebecca-agent-dom.controller/sign-in', payload);
    return res.data;
}
