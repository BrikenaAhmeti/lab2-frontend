import { ReactNode } from 'react';
// import LeftSidebar from '@/ui/organisms/LeftSidebar';
// import RightSidebar from '@/ui/organisms/RightSidebar';
// import Topbar from '@/ui/organisms/Topbar';
import { useAppSelector } from '@/app/hooks';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAppSelector(s => s.auth);
  const role = user?.role || localStorage.getItem('role');
  const showRightSidebar = role === 'admins';

  return (
    <div className="min-h-screen flex flex-col">
      {/* <Topbar /> */}
      <div className="flex flex-1">
        <aside className="hidden md:block w-64 border-r border-gray-200 dark:border-gray-800">
          {/* <LeftSidebar /> */}
        </aside>
        <main className="flex-1 p-4 md:p-6">{children}</main>
        {showRightSidebar && (
          <aside className="hidden lg:block w-80 border-l border-gray-200 dark:border-gray-800">
            {/* <RightSidebar /> */}
          </aside>
        )}
      </div>
    </div>
  );
}
