import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface PasswordProtectionProps {
  onCorrectPassword: () => void;
  correctPassword: string;
}

const PasswordProtection: React.FC<PasswordProtectionProps> = ({ 
  onCorrectPassword,
  correctPassword 
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === correctPassword) {
      onCorrectPassword();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl 
                      transform transition-transform ${shake ? 'animate-shake' : ''}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
            Password Protected
          </h2>
          
          <p className="text-gray-500 dark:text-gray-400 text-center">
            This section requires a password to access.
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4 mt-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className={`w-full px-4 py-2 rounded-lg border ${
                  error 
                    ? 'border-red-500 dark:border-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                } 
                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-600`}
                placeholder="Enter password"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                  Incorrect password. Please try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg
                         transform transition-transform active:scale-95"
            >
              Unlock Access
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordProtection; 