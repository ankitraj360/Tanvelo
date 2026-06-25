import { Mountain } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white pt-20 pb-10 px-6 border-t border-gray-100">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 font-medium text-lg tracking-tight text-gray-900">
            <Mountain className="w-6 h-6" />
            Tanvelo
          </div>
          <div className="text-gray-500 font-light space-y-1">
            <p>teamkaios000@gmail.com</p>
            <p>@tanvelo.in</p>
          </div>
        </div>

        <div className="flex flex-col md:items-end gap-6">
          <div className="flex gap-6 text-sm font-medium text-gray-500">
            <a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
          </div>
          <p className="text-sm text-gray-400 font-light">
            © 2026 Tanvelo. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
