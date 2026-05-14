import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { portalConfigs, type PortalKey } from './portalConfig';

export default function PortalLayout({ portalKey }: { portalKey: PortalKey }) {
  const portal = portalConfigs[portalKey];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-[1680px]">
        <Sidebar portal={portal} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar portal={portal} />
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
