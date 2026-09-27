import React, { useState, useEffect, useRef, memo } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { 
  LogIn, 
  LogOut, 
  AtSign, 
  Lock, 
  UserPlus, 
  X, 
  AlertCircle, 
  Sparkles, 
  Loader2,
  Check,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export interface UserAuthProps {
  onUserChange: (user: FirebaseUser | null) => void;
  openAuthTrigger?: { mode: 'signin' | 'signup'; id: number } | null;
  onCloseAuthTrigger?: () => void;
}

// Convert a clean username into an internal auth email
const usernameToInternalEmail = (username: string): string => {
  const sanitized = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  return `${sanitized}@scrubadub.internal`;
};

// Validate username format (letters, numbers, underscores, periods, hyphens; 3-24 chars)
const validateUsername = (username: string): string | null => {
  const trimmed = username.trim();
  if (!trimmed) return 'Username is required.';
  if (trimmed.length < 3) return 'Username must be at least 3 characters.';
  if (trimmed.length > 24) return 'Username must be 24 characters or less.';
  if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
    return 'Username can only contain letters, numbers, underscores, hyphens, and dots.';
  }
  return null;
};

// Separate, highly performant Auth Modal component to isolate form input state
export const AuthModal = memo(function AuthModal({
  isOpen,
  initialMode,
  onClose
}: {
  isOpen: boolean;
  initialMode: 'signin' | 'signup';
  onClose: () => void;
}) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setAuthMode(initialMode);
    setError(null);
    setSuccessMsg(null);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanUser = username.trim();
    const userErr = validateUsername(cleanUser);
    if (userErr) {
      setError(userErr);
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const internalEmail = usernameToInternalEmail(cleanUser);
    const normalizedUsername = cleanUser.toLowerCase();

    setLoading(true);

    try {
      if (authMode === 'signin') {
        await signInWithEmailAndPassword(auth, internalEmail, password);
        setSuccessMsg('Successfully signed in!');
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        // Check uniqueness in Firestore
        try {
          const usernameDocRef = doc(db, 'usernames', normalizedUsername);
          const usernameSnap = await getDoc(usernameDocRef);
          if (usernameSnap.exists()) {
            setError('This username is already taken. Please choose another one.');
            setLoading(false);
            return;
          }
        } catch {
          // If firestore read check fails, proceed with creation
        }

        // Create account
        const userCredential = await createUserWithEmailAndPassword(auth, internalEmail, password);

        // Update displayName to clean username
        await updateProfile(userCredential.user, {
          displayName: cleanUser
        });

        // Reserve username doc in Firestore
        try {
          const usernameDocRef = doc(db, 'usernames', normalizedUsername);
          await setDoc(usernameDocRef, {
            uid: userCredential.user.uid,
            username: cleanUser,
            createdAt: new Date().toISOString()
          });
        } catch {
          // non-blocking
        }

        setSuccessMsg('Account created successfully!');
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let friendlyMessage = err.message || 'Authentication failed.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        friendlyMessage = 'Invalid username or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'This username is already taken. Please choose another one or sign in.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'The password must be at least 6 characters.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMessage = 'Too many failed attempts. Please try again in a few moments.';
      } else if (err.code === 'auth/unauthorized-domain') {
        friendlyMessage = `This domain (${window.location.hostname}) is not added to Authorized Domains in Firebase Authentication.`;
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      setSuccessMsg('Signed in with Google!');
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        let msg = err.message || 'Google sign in failed.';
        if (err.code === 'auth/unauthorized-domain') {
          msg = `This domain (${window.location.hostname}) is not added to Authorized Domains in Firebase Authentication.`;
        }
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80">
      <div className="relative w-full max-w-sm bg-[#1E293B] border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#131B2E]/60">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
              {authMode === 'signin' ? 'Sign In' : 'Create Account'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-[11px] text-rose-400 font-mono flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-none mt-0.5" />
              <span className="leading-tight">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-[11px] text-emerald-400 font-mono flex items-start gap-1.5">
              <Check className="w-4 h-4 text-emerald-500 flex-none mt-0.5" />
              <span className="leading-tight">{successMsg}</span>
            </div>
          )}

          {/* 1-Click Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-9 px-3 flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 rounded-md text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-800"></div>
            <span className="absolute px-2 bg-[#1E293B] text-[9px] uppercase font-bold tracking-widest text-slate-500">
              or
            </span>
          </div>

          <form onSubmit={handleAuthAction} className="space-y-4">
            <div className="space-y-3">
              {/* Username Field */}
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                  <AtSign className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                  placeholder="e.g. alex_smith"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  disabled={loading}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#020617] border border-slate-800 rounded-md text-xs font-mono text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-colors placeholder:text-slate-700"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                  <Lock className="w-3.5 h-3.5" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                  disabled={loading}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#020617] border border-slate-800 rounded-md text-xs font-mono text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-colors placeholder:text-slate-700"
                />
              </div>
            </div>

            {/* Confirm Password (Signup only) */}
            {authMode === 'signup' && (
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required={authMode === 'signup'}
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full pl-9 pr-3 py-1.5 bg-[#020617] border border-slate-800 rounded-md text-xs font-mono text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-colors placeholder:text-slate-700"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-8 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : authMode === 'signin' ? (
                <LogIn className="w-3.5 h-3.5" />
              ) : (
                <UserPlus className="w-3.5 h-3.5" />
              )}
              {authMode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>

            {/* Switch between modes */}
            <div className="text-center pb-1">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMsg(null);
                  setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                }}
                className="text-[10px] text-slate-400 hover:text-white transition-colors underline decoration-dotted underline-offset-4 cursor-pointer"
              >
                {authMode === 'signin' 
                  ? "Don't have an account? Sign Up" 
                  : 'Already have an account? Sign In'}
              </button>
            </div>

            {/* Data privacy & ownership notice when creating an account */}
            {authMode === 'signup' && (
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 text-center leading-relaxed space-y-1.5">
                <p className="text-slate-300/80 leading-normal text-center">
                  <span className="inline-flex items-center justify-center gap-1.5 font-semibold text-slate-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/90 flex-shrink-0" />
                    <span>Your data belongs to <span className="underline decoration-slate-300 decoration-[1.5px] underline-offset-2">you</span><span className="font-normal text-slate-300">.</span></span>
                  </span>
                  <br />
                  We will never sell, share, or otherwise provide your data to any third party or use it for any advertising, marketing, or other promotional purposes.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1 border-t border-slate-800/80 text-[10px]">
                  <a 
                    href="https://github.com/MrTWrecks0208/Scrubadub/blob/main/Privacy-Policy.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    <span>Privacy Policy</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <span className="text-slate-600">•</span>
                  <a 
                    href="https://github.com/MrTWrecks0208/Scrubadub/blob/main/ToS.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    <span>Terms of Service</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </form>
        </div>
      </div>
    </div>
  );
});

export default function UserAuth({ onUserChange, openAuthTrigger, onCloseAuthTrigger }: UserAuthProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Respond to parent open triggers
  useEffect(() => {
    if (openAuthTrigger) {
      setAuthMode(openAuthTrigger.mode);
      setIsModalOpen(true);
    }
  }, [openAuthTrigger]);

  // Dropdown & Avatar states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      onUserChange(user);
    });
    return () => unsubscribe();
  }, [onUserChange]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute avatar URL based on username
  const displayUsername = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';

  useEffect(() => {
    if (currentUser) {
      const nameStr = (currentUser.displayName || currentUser.email?.split('@')[0] || 'user').trim().toLowerCase();
      setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(nameStr)}&background=6366f1&color=fff&bold=true&length=2`);
    } else {
      setAvatarUrl('');
    }
  }, [currentUser]);

  const handleOpenModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    onCloseAuthTrigger?.();
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div ref={dropdownRef} className="relative flex items-center">
      {currentUser ? (
        <div className="relative">
          {/* Avatar button */}
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center justify-center w-8 h-8 rounded-full border bg-slate-900 transition-all duration-150 cursor-pointer overflow-hidden ${
              isDropdownOpen 
                ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                : 'border-slate-800 hover:border-slate-700 hover:scale-105'
            }`}
            title={`@${displayUsername}`}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="User Avatar"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-[10px] font-mono font-bold uppercase">
                {displayUsername.substring(0, 2)}
              </div>
            )}
          </button>

          {/* Contextual Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-[#131B2E] border border-slate-800 rounded-lg py-1 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-100">
              <div className="px-3 py-1.5 border-b border-slate-800/60 select-none">
                <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Logged In As</div>
                <div className="text-[11px] font-mono font-medium text-indigo-400 mt-0.5 truncate" title={`@${displayUsername}`}>
                  @{displayUsername}
                </div>
              </div>
              <div className="p-1">
                <div className="px-2.5 py-1.5 border-b border-slate-800/60 mb-1 space-y-1">
                  <a 
                    href="https://github.com/MrTWrecks0208/Scrubadub/blob/main/Privacy-Policy.md" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-between text-[11px] text-slate-400 hover:text-white transition-colors"
                  >
                    <span>Privacy Policy</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                  <a 
                    href="https://github.com/MrTWrecks0208/Scrubadub/blob/main/ToS.md" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-between text-[11px] text-slate-400 hover:text-white transition-colors"
                  >
                    <span>Terms of Service</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-md transition-colors cursor-pointer text-left font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => handleOpenModal('signin')}
          className="flex items-center justify-center gap-1.5 h-8 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-sm hover:shadow-md whitespace-nowrap shrink-0"
        >
          <LogIn className="w-3.5 h-3.5 shrink-0" />
          <span>Sign In</span>
        </button>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isModalOpen}
        initialMode={authMode}
        onClose={handleCloseModal}
      />
    </div>
  );
}

