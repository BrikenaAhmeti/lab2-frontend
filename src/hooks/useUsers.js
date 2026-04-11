import { useQuery } from '@tanstack/react-query';
import { api } from '@/libs/axios/client';
async function fetchUsers() {
    const { data } = await api.core.get('/users'); // your API
    return data;
}
export function useUsers() {
    return useQuery({
        queryKey: ['users'],
        queryFn: fetchUsers,
        staleTime: 1000 * 60 * 5,
        retry: (failCount, err) => {
            if (err?.response?.status === 401 && failCount < 2)
                return true;
            return failCount < 3;
        }
    });
}
