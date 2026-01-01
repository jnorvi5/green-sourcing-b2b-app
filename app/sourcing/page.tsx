import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SourcingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">Verify Data & Sourcing</h1>
        <p className="text-xl text-muted-foreground">
          Our advanced data verification tools are coming soon.
          You'll be able to instantly verify environmental claims, check EPD validity, and source compliant materials.
        </p>
        <div className="pt-8">
          <Link href="/">
            <Button variant="default" size="lg">
              Back to Marketplace
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
