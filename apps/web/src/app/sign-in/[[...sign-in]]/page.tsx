import { SignIn, ClerkLoaded, ClerkLoading } from '@clerk/nextjs';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/" className="inline-block hover:opacity-90 transition">
          <Logo size="lg" />
        </Link>
      </div>
      <div className="w-full flex justify-center min-h-[480px]">
        <ClerkLoading>
          <div className="w-full max-w-[400px] bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center min-h-[440px] text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-800">Loading sign in...</p>
            <p className="text-xs text-slate-500 mt-1">Establishing secure connection to Tanvelo</p>
          </div>
        </ClerkLoading>
        <ClerkLoaded>
          <SignIn routing="path" path="/sign-in" fallbackRedirectUrl="/overview" />
        </ClerkLoaded>
      </div>
    </div>
  );
}
