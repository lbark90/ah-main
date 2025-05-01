
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const isMainPage = pathname === '/';
  const isLoginPage = pathname === '/login';
  const isRegistrationPage = pathname === '/registration';

  if (isMainPage || isLoginPage || isRegistrationPage) {
    return null;
  }

  return (
    <header className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-light">
          AliveHere<span className="text-blue-400">.com</span>
        </Link>
        {!isMainPage && !isLoginPage && (
          <div className="flex items-center gap-6">
            <nav>
              <ul className="flex items-center gap-6">
                <li>
                  <Link href="/interview" className="text-sm hover:text-blue-400 transition-colors">
                    Interview
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="text-sm hover:text-blue-400 transition-colors">
                    Profile
                  </Link>
                </li>
                <li>
                  <Link href="/conversation" className="text-sm hover:text-blue-400 transition-colors">
                    Conversation
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
