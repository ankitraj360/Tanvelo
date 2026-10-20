import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-600 mb-6">Could not find requested resource.</p>
      <Link
        href="/"
        className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-black transition"
      >
        Return Home
      </Link>
    </div>
  );
}
