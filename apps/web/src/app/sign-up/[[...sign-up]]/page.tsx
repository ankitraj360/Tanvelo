import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/" className="inline-block hover:opacity-90 transition">
          <Logo size="lg" />
        </Link>
      </div>
      <div className="w-full flex justify-center">
        <SignUp routing="path" path="/sign-up" fallbackRedirectUrl="/overview" />
      </div>
    </div>
  );
}
