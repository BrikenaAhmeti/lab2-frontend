import DashboardLayout from '@/ui/layouts/DashboardLayout';
import { formatMoney } from '@/config/currencies';
import { useUsers } from '@/hooks/useUsers';

const Home = () => {
  const { data, isLoading, error } = useUsers();
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-semibold mb-4">Overview</h1>
      <div className="rounded-xl border p-4 mb-4">
        Revenue Today: {formatMoney(12345.67)}
      </div>
      <div className="rounded-xl border p-4">
        <h2 className="font-semibold mb-2">Users (fetched via TanStack Query)</h2>
        {isLoading && <div>Loading...</div>}
        {error && <div>Error loading users</div>}
        {!isLoading && !error && (
          <ul className="list-disc ml-6">
            {data?.map((u: any) => <li key={u.id}>{u.name}</li>)}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
}
export default Home;