import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[400px] bg-white border border-slate-200/80 rounded-2xl p-8 shadow-xs flex flex-col items-center justify-center min-h-[260px] text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-800">Completing authentication...</p>
        <p className="text-xs text-slate-500 mt-1">Establishing secure session with Tanvelo</p>
      </div>
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/overview"
        signUpFallbackRedirectUrl="/overview"
      />
    </div>
  );
}
