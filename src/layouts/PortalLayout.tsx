import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { portalConfigs, type PortalKey } from './portalConfig';

export default function PortalLayout({ portalKey }: { portalKey: PortalKey }) {
  const portal = portalConfigs[portalKey];

  return (
    <div className="h-screen overflow-hidden bg-background">
      <div className="mx-auto flex h-full max-w-[1680px] overflow-hidden">
        <Sidebar portal={portal} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar portal={portal} />
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
