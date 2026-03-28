import type { ReactNode } from 'react';
import AuthHero from './AuthHero';

export default function AuthLayout({ left }: { left: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <div className="w-full lg:w-1/2 px-6 lg:px-12 py-10 flex flex-col">
          {left}
        </div>
        <div className="hidden lg:block lg:w-1/2">
          <AuthHero />
        </div>
      </div>
    </div>
  );
}
