import Image from 'next/image';
import SignupForm from '@/components/SignupForm';

export default function SignupPage() {
  return (
    <div className="min-h-screen">
      {/* Preload critical CSS */}
      <link rel="preload" href="/_next/static/css/app.css" as="style" />

      {/* Prioritize hero image */}
      <Image
        src="/hero.png"
        alt="GreenChainz"
        width={800}
        height={600}
        priority // ✅ Tells Next.js to preload
        placeholder="blur"
        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
      />

      <SignupForm />
    </div>
  );
}
