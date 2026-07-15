import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

interface GoogleButtonProps {
  onSuccess: (credentialResponse: any) => void;
  onError?: () => void;
  isLoading?: boolean;
  text?: string;
}

const GoogleButton: React.FC<GoogleButtonProps> = ({
  onSuccess,
  onError,
  isLoading = false,
}) => {
  // Show a loading indicator ONLY after Google returns a credential (i.e., after the popup closes).
  // Never disable or hide the GoogleLogin button before the popup opens — that causes the
  // GIS (Google Identity Services) SDK to fail to register the button properly, producing
  // the ~2-minute initialisation delay observed in production.
  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center gap-3 h-[44px] rounded-full border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/60 backdrop-blur-sm shadow-sm text-sm font-semibold text-gray-500 dark:text-gray-400">
        <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        Connecting with Google...
      </div>
    );
  }

  // Use the official GoogleLogin component directly — no invisible overlay, no z-index tricks.
  // This guarantees the GIS SDK can render and initialise the button on first paint,
  // so the account-selector popup opens immediately on click.
  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        useOneTap={false}
        text="continue_with"
        theme="outline"
        size="large"
        shape="pill"
      />
    </div>
  );
};

export default GoogleButton;
