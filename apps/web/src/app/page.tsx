import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 px-4">
      <div className="flex flex-col items-center gap-8 max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-7 h-7 text-primary-foreground"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Helpdesk</h1>
        </div>

        {/* Description */}
        <p className="text-muted-foreground text-base leading-relaxed">
          A simple, fast ticketing system for your support team.
          Manage requests, track progress, and keep customers happy.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <Button asChild size="lg" className="w-full">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full">
            <Link href="/register">Create account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
