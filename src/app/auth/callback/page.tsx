'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [message, setMessage] = useState('Processing authentication...');
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
          setStatus('error');
          setMessage('No authentication token received');
          setTimeout(() => router.push('/login'), 3000);
          return;
        }

        // Store the token
        localStorage.setItem('accessToken', token);

        // Fetch user profile data using the token
        const backendUrl =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/users/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          localStorage.setItem('user', JSON.stringify(userData));

          setStatus('success');
          setMessage('Authentication successful! Redirecting to dashboard...');

          setTimeout(() => router.push('/dashboard'), 1500);
        } else {
          throw new Error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('Authentication failed. Redirecting to login...');

        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          {status === 'loading' && (
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          )}
          {status === 'success' && (
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
          {status === 'error' && (
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {status === 'loading' && 'Authenticating...'}
          {status === 'success' && 'Success!'}
          {status === 'error' && 'Authentication Failed'}
        </h2>

        <p className="text-gray-600 mb-6">{message}</p>

        {status === 'loading' && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
}
