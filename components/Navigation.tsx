'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSession, signOut } from 'next-auth/react';

export function Navigation() {
  const { isAuthenticated, login, isLoading } = useAuth();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isProfileMenuOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/95 backdrop-blur-xl border-b border-white/8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 sm:py-5">
          {/* Logo */}
          <Link href="/" className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            MASSIVE<span className="text-accent">HIKE</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="flex items-center gap-3 sm:gap-6 lg:gap-9">
            {/* Desktop Links */}
            <Link
              href="/dashboard"
              className="hidden sm:block text-sm font-medium text-gray-400 hover:text-white uppercase tracking-wider transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/referrals"
              className="hidden sm:block text-sm font-medium text-gray-400 hover:text-white uppercase tracking-wider transition-colors"
            >
              Referrals
            </Link>

            {/* Desktop Login/Signup or Profile */}
            {!isAuthenticated ? (
              <button
                onClick={login}
                disabled={isLoading}
                className="hidden sm:flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-accent text-black font-bold text-xs sm:text-sm rounded-md hover:scale-105 transition-transform whitespace-nowrap disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            ) : (
              <div ref={profileMenuRef} className="hidden sm:block relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="w-8 h-8 rounded-full border-2 border-white/20"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-sm">
                      {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-bg border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-medium text-white truncate">{session?.user?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        signOut({ callbackUrl: '/' });
                      }}
                      className="w-full px-4 py-2.5 text-sm text-left text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-2 text-white hover:text-accent transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-white/8 bg-bg/98 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4 space-y-3">
            <Link
              href="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg uppercase tracking-wider transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/referrals"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg uppercase tracking-wider transition-colors"
            >
              Referrals
            </Link>

            {!isAuthenticated ? (
              <button
                onClick={() => {
                  login();
                  setIsMobileMenuOpen(false);
                }}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-accent text-black font-bold text-sm rounded-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            ) : (
              <div className="border-t border-white/8 pt-3">
                <div className="flex items-center gap-3 px-4 py-3 mb-2">
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="w-10 h-10 rounded-full border-2 border-white/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold">
                      {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{session?.user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                  className="w-full px-4 py-3 text-sm text-left text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
