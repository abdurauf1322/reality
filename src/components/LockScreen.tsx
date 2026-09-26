import { useState, useEffect } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { securityService } from '../services/securityService';

interface LockScreenProps {
  children: React.ReactNode;
}

export const LockScreen = ({ children }: LockScreenProps) => {
  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  useEffect(() => {
    checkInitialLock();
    // Listen for manual lock events
    const handleManualLock = () => setIsLocked(true);
    window.addEventListener('manual-lock', handleManualLock);
    return () => window.removeEventListener('manual-lock', handleManualLock);
  }, []);

  const checkInitialLock = async () => {
    try {
      const enabled = await securityService.isPasswordEnabled();
      setIsLocked(enabled);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutUntil && Date.now() < lockoutUntil) return;

    setError('');
    setIsVerifying(true);

    try {
      const isValid = await securityService.verifyPassword(password);
      if (isValid) {
        setIsLocked(false);
        setPassword('');
        setAttempts(0);
        setLockoutUntil(null);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setError("Parol noto'g'ri.");
        
        // Simple throttling
        if (newAttempts >= 3) {
          const timeout = 5000 * Math.pow(2, newAttempts - 3); // 5s, 10s, 20s...
          setLockoutUntil(Date.now() + timeout);
          setError(`Juda ko'p urinishlar. ${timeout / 1000} soniyadan so'ng qayta urinib ko'ring.`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsVerifying(false);
    }
  };

  // Timer for lockout message update
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (!lockoutUntil) return;
    const interval = setInterval(() => {
      const diff = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (diff <= 0) {
        setLockoutUntil(null);
        setError('');
      } else {
        setTimeLeft(diff);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-sm border border-gray-200">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-50 p-4 rounded-full mb-4">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Tizim Qulflangan</h1>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Dasturga kirish uchun parolni kiriting
          </p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!!lockoutUntil || isVerifying}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest disabled:bg-gray-100"
              placeholder="••••••"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm font-medium text-center bg-red-50 p-2 rounded">
              {lockoutUntil ? `Kuting: ${timeLeft} soniya` : error}
            </div>
          )}

          <button
            type="submit"
            disabled={!!lockoutUntil || isVerifying || !password}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {isVerifying ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Unlock size={18} /> Qulfdan chiqarish
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
