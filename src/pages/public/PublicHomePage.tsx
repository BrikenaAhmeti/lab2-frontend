import { Link } from 'react-router-dom';
import Button from '@/ui/atoms/Button';

export default function PublicHomePage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-12">
        <div className="mb-8 flex items-center gap-3">
          <img src="/medsphere.png" alt="MedSphere" className="h-12 w-12 rounded-lg object-cover" />
          <p className="text-lg font-semibold text-foreground">MedSphere</p>
        </div>
        <div className="max-w-3xl">
          <h1 className="text-5xl font-semibold text-foreground">MedSphere</h1>
          <p className="mt-5 text-lg text-muted">
            Department-aware healthcare operations for patients, clinicians, laboratories, pharmacy,
            reception, and administration.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login">
              <Button>Sign in</Button>
            </Link>
            <Link to="/public">
              <Button variant="secondary">Public website</Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
