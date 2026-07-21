import React, { useState, useEffect, useRef } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { 
  LogIn, 
  LogOut, 
  Mail, 
  Lock, 
  UserPlus, 
  X, 
  AlertCircle, 
  Sparkles, 
  Loader2,
  Check
} from 'lucide-react';

interface UserAuthProps {
  onUserChange: (user: FirebaseUser | null) => void;
}

export default function UserAuth({ onUserChange }: UserAuthProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Dropdown & Avatar states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  // Compute Gravatar URL on user change
  useEffect(() => {
    if (currentUser && currentUser.email) {
      const emailStr = currentUser.email.trim().toLowerCase();
      const msgUint8 = new TextEncoder().encode(emailStr);
      crypto.subtle.digest('SHA-256', msgUint8).then((hashBuffer) => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setAvatarUrl(`https://www.gravatar.com/avatar/${hashHex}?d=identicon&s=128`);
      }).catch((err) => {
        console.error('Error generating gravatar hash:', err);
        setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(emailStr)}&background=6366f1&color=fff&bold=true`);
      });
    } else {
      setAvatarUrl('');
    }
  }, [currentUser]);

  const handleOpenModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setError(null);
    setSuccessMsg(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (authMode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccessMsg('Successfully signed in!');
        setTimeout(() => {
          setIsModalOpen(false);
        }, 800);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccessMsg('Account created successfully!');
        setTimeout(() => {
          setIsModalOpen(false);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let friendlyMessage = err.message;
      if (err.code === 'auth/invalid-credential') {
        friendlyMessage = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'An account with this email already exists.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'The password is too weak.';
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
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
            title={currentUser.email || 'User Account'}
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
                {currentUser.email ? currentUser.email.substring(0, 2) : 'US'}
              </div>
            )}
          </button>

          {/* Contextual Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-[#131B2E] border border-slate-800 rounded-lg py-1 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-100">
              <div className="px-3 py-1.5 border-b border-slate-800/60 select-none">
                <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">Logged In As</div>
                <div className="text-[11px] font-mono font-medium text-slate-300 mt-0.5 truncate" title={currentUser.email || ''}>
                  {currentUser.email || 'User'}
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
          className="flex items-center gap-1.5 h-6 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:shadow-md"
        >
          <LogIn className="w-3 h-3" />
          Sign In
        </button>
      )}

      {/* Auth Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
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
                onClick={handleCloseModal}
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
                {/* Email Field */}
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Mail className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      disabled={loading}
                      className="w-full pl-9 pr-3 py-1.5 bg-[#020617] border border-slate-800 rounded-md text-xs font-mono text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={loading}
                      className="w-full pl-9 pr-3 py-1.5 bg-[#020617] border border-slate-800 rounded-md text-xs font-mono text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
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
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required={authMode === 'signup'}
                        disabled={loading}
                        className="w-full pl-9 pr-3 py-1.5 bg-[#020617] border border-slate-800 rounded-md text-xs font-mono text-slate-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
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
                  className="w-full h-8 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : authMode === 'signin' ? (
                    <LogIn className="w-3.5 h-3.5" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>

                {/* Switch between modes */}
                <div className="text-center pb-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
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
      )}
    </div>
  );
}
