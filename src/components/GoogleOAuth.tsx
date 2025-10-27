'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useToast } from '@/components/ui/toast';

interface GoogleOAuthProps {
  mode: 'login' | 'signup';
  disabled?: boolean;
  className?: string;
}

export default function GoogleOAuth({
  mode: _mode,
  disabled = false,
  className = '',
}: GoogleOAuthProps) {
  const { showToast } = useToast();

  const handleGoogleAuth = () => {
    try {
      // Redirect to backend Google OAuth endpoint
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      window.location.href = `${backendUrl}/auth/google`;
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Authentication Error',
        description: 'Failed to initiate Google authentication. Please try again.',
      });
    }
  };

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        className="w-full h-10 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all duration-200 text-sm"
        disabled={disabled}
        onClick={handleGoogleAuth}
        data-testid="google-oauth-button"
      >
        <Image
          src="/svg/google.svg"
          alt="Google"
          width={20}
          height={20}
          className="mr-2"
        />
        Continue with Google
      </Button>
    </div>
  );
}
