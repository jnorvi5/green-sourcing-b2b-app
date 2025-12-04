import Link from 'next/link';

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-16">
        <Link href="/" className="text-teal-400 hover:underline mb-8 inline-block">← Back to Home</Link>
        
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Join as a Supplier</h1>
          <p className="text-gray-400 mb-8">Create your verified supplier profile to connect with architects and buyers.</p>
          
          <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <p className="text-center text-gray-400">Supplier registration coming Q1 2026</p>
            <p className="text-center text-sm text-gray-500 mt-4">
              Join the waitlist from the <Link href="/" className="text-teal-400 underline">homepage</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
