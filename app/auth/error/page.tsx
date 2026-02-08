'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { constants } from '@/lib/constants';

const errorMessages: Record<string, { title: string; description: string }> = {
  AccessDenied: {
    title: 'Access Denied',
    description: 'Sign-in was cancelled or an error occurred during authentication. Please try again.',
  },
  Configuration: {
    title: 'Configuration Error',
    description: 'There is a problem with the server configuration. Please contact support.',
  },
  Verification: {
    title: 'Verification Failed',
    description: 'The verification token has expired or has already been used.',
  },
  Default: {
    title: 'Authentication Error',
    description: 'An error occurred during authentication. Please try again.',
  },
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';
  const errorInfo = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-3xl font-extrabold tracking-tight text-white mb-4">
            MASSIVE<span className="text-accent">HIKE</span>
          </Link>
        </div>

        {/* Error Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/8 shadow-xl">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          {/* Error Message */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white mb-3">
              {errorInfo.title}
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              {errorInfo.description}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="block w-full bg-accent hover:bg-accent/90 text-black font-bold py-4 px-6 rounded-xl text-center transition-all hover:scale-105 shadow-lg uppercase tracking-wide"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="block w-full bg-white/5 hover:bg-white/10 text-white font-semibold py-4 px-6 rounded-xl text-center transition-all border border-white/8 uppercase tracking-wide"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-xs">
            Need help? Contact support at{' '}
            <a href={`mailto:${constants.SUPPORT_EMAIL}`} className="text-accent hover:underline">
              {constants.SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
