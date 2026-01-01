import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">Join the GreenChainz Team</h1>
        <p className="text-xl text-muted-foreground">
          We're building the future of sustainable construction.
          While we don't have any open positions right now, we're always looking for talented individuals passionate about sustainability.
        </p>
        <p className="text-md text-muted-foreground">
          Check back soon or follow us on LinkedIn for updates.
        </p>
        <div className="pt-8">
          <Link href="/">
            <Button variant="default" size="lg">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
