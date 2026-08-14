import React, { useState, useEffect, useRef, memo } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
  Check
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
        <form onSubmit={handleAuthAction} className="p-5 space-y-4">
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
          </div>
        </form>
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

