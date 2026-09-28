import React, { useState, useEffect } from 'react';
import { 
  Cookie, 
  ShieldCheck, 
  Sliders, 
  Check, 
  X, 
  ChevronRight, 
  ExternalLink, 
  Lock, 
  Info,
  Scale
} from 'lucide-react';

export interface CookiePreferences {
  essential: boolean; // Always true
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  doNotSell: boolean; // CCPA/CPRA opt-out toggle
  consentedAt: string;
  version: string;
}

const COOKIE_STORAGE_KEY = 'scrubadub_cookie_consent_v1';
const CURRENT_POLICY_VERSION = '2026.1';

const defaultPreferences: CookiePreferences = {
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
  doNotSell: true, // Default to opting out of sale/sharing for highest privacy
  consentedAt: '',
  version: CURRENT_POLICY_VERSION,
};

export const getSavedCookiePreferences = (): CookiePreferences | null => {
  try {
    const raw = localStorage.getItem(COOKIE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse cookie preferences:', e);
    return null;
  }
};

export const saveCookiePreferencesToStorage = (prefs: CookiePreferences) => {
  try {
    const updated = {
      ...prefs,
      essential: true, // Essential is always true
      consentedAt: new Date().toISOString(),
      version: CURRENT_POLICY_VERSION,
    };
    localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(updated));
    // Dispatch custom event so any listeners update in real time
    window.dispatchEvent(new CustomEvent('cookie-preferences-updated', { detail: updated }));
    return updated;
  } catch (e) {
    console.error('Failed to save cookie preferences:', e);
    return prefs;
  }
};

// Global helper to trigger the cookie preferences modal from any button (e.g. footer)
export const openCookiePreferencesModal = (tab?: 'categories' | 'ccpa') => {
  window.dispatchEvent(new CustomEvent('open-cookie-preferences', { detail: { tab } }));
};

export default function CookieBanner() {
  const [preferences, setPreferences] = useState<CookiePreferences>(() => {
    return getSavedCookiePreferences() || defaultPreferences;
  });
  const [hasConsented, setHasConsented] = useState<boolean>(true); // Default true until mounted to avoid flicker
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'categories' | 'ccpa'>('categories');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('essential');
  const [showSavedFeedback, setShowSavedFeedback] = useState<boolean>(false);

  useEffect(() => {
    const saved = getSavedCookiePreferences();
    if (!saved) {
      // Small timeout for gentle mount
      const timer = setTimeout(() => {
        setHasConsented(false);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setPreferences(saved);
      setHasConsented(true);
    }
  }, []);

  // Listen for custom open event triggered by footer or external links
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.tab) {
        setActiveTab(customEvent.detail.tab);
      }
      setIsModalOpen(true);
    };

    window.addEventListener('open-cookie-preferences', handleOpen);
    return () => window.removeEventListener('open-cookie-preferences', handleOpen);
  }, []);

  const handleAcceptAll = () => {
    const updated: CookiePreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
      doNotSell: false,
      consentedAt: new Date().toISOString(),
      version: CURRENT_POLICY_VERSION,
    };
    setPreferences(updated);
    saveCookiePreferencesToStorage(updated);
    setHasConsented(true);
    setIsModalOpen(false);
  };

  const handleRejectAll = () => {
    const updated: CookiePreferences = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
      doNotSell: true, // CCPA opt-out strictly enforced
      consentedAt: new Date().toISOString(),
      version: CURRENT_POLICY_VERSION,
    };
    setPreferences(updated);
    saveCookiePreferencesToStorage(updated);
    setHasConsented(true);
    setIsModalOpen(false);
  };

  const handleSavePreferences = () => {
    saveCookiePreferencesToStorage(preferences);
    setHasConsented(true);
    setShowSavedFeedback(true);
    setTimeout(() => {
      setShowSavedFeedback(false);
      setIsModalOpen(false);
    }, 600);
  };

  const toggleCategory = (key: keyof Pick<CookiePreferences, 'functional' | 'analytics' | 'marketing'>) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleDoNotSellToggle = (checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      doNotSell: checked,
      // If opting out of selling/sharing under CCPA/CPRA, automatically disable optional marketing
      marketing: checked ? false : prev.marketing,
    }));
  };

  return (
    <>
      {/* 1. BOTTOM DOCKED COOKIE BANNER (Initial Notice) */}
      {!hasConsented && (
        <aside 
          aria-label="Cookie & Privacy Consent Banner"
          role="region"
          className="fixed bottom-0 inset-x-0 z-[90] p-3 sm:p-4 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-none"
        >
          <div className="max-w-5xl mx-auto bg-[#131B2E] border border-slate-700/80 rounded-xl shadow-2xl p-4 sm:p-5 text-slate-300 pointer-events-auto backdrop-blur-md">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              
              {/* Text / Information */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                  <Cookie className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                      Privacy & Cookie Consent
                    </h3>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                      GDPR & CCPA/CPRA Compliant
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed max-w-3xl">
                    We use cookies and local browser storage to run core features (such as your session, saved regular expressions, and security). We respect your privacy rights under GDPR and California’s CCPA/CPRA: <strong>we do not sell or share your personal information</strong>. For full details on how we safeguard your data, view our{' '}
                    <a 
                      href="https://github.com/MrTWrecks0208/Scrubadub/blob/main/Privacy-Policy.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 underline font-semibold inline-flex items-center gap-0.5"
                    >
                      Privacy Policy <ExternalLink className="w-2.5 h-2.5 inline" />
                    </a>. Choose your preferences below.
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400 font-mono">
                    <a 
                      href="https://github.com/MrTWrecks0208/Scrubadub/blob/main/Privacy-Policy.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 flex items-center gap-1 font-semibold"
                    >
                      Privacy Policy <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('ccpa');
                        setIsModalOpen(true);
                      }}
                      className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 cursor-pointer"
                    >
                      Do Not Sell or Share My Info (CCPA)
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 w-full md:w-auto shrink-0 pt-2 md:pt-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('categories');
                    setIsModalOpen(true);
                  }}
                  className="sm:w-[130px] h-7 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[11px] font-medium transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-center"
                >
                  <Sliders className="w-3 h-3 text-slate-400" />
                  <span>Customize</span>
                </button>

                <button
                  type="button"
                  onClick={handleRejectAll}
                  className="sm:w-[130px] h-7 px-2 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-700 rounded text-[11px] font-medium transition-colors cursor-pointer inline-flex items-center justify-center whitespace-nowrap text-center"
                >
                  Reject non-essential
                </button>

                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="sm:w-[130px] h-7 px-2 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 rounded text-[11px] font-medium transition-colors shadow-xs cursor-pointer inline-flex items-center justify-center whitespace-nowrap text-center"
                >
                  Accept all
                </button>
              </div>

            </div>
          </div>
        </aside>
      )}

      {/* 2. GRANULAR PREFERENCES MODAL (GDPR Categories & CCPA/CPRA Opt-Out) */}
      {isModalOpen && (
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="cookie-preferences-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-2xl bg-[#1E293B] border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#131B2E]">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                  <Cookie className="w-4 h-4" />
                </div>
                <div>
                  <h2 id="cookie-preferences-title" className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                    Cookie & Privacy Preferences
                  </h2>
                  <p className="text-[10px] text-slate-400 font-mono">
                    GDPR (EU/UK) & CCPA/CPRA (California) Compliance Center
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://github.com/MrTWrecks0208/Scrubadub/blob/main/Privacy-Policy.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono text-indigo-400 hover:text-white hover:bg-indigo-600 border border-indigo-500/30 transition-colors"
                >
                  <span>Privacy Policy</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-[#0F172A]/70 px-5 pt-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className={`pb-2.5 px-2 font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer text-[11px] flex items-center gap-1.5 ${
                  activeTab === 'categories'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Cookie Categories</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ccpa')}
                className={`pb-2.5 px-2 font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer text-[11px] flex items-center gap-1.5 ${
                  activeTab === 'ccpa'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Do Not Sell / CCPA Rights</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              
              {showSavedFeedback && (
                <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/50 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Your privacy preferences have been updated and saved.</span>
                </div>
              )}

              {/* TAB 1: COOKIE CATEGORIES */}
              {activeTab === 'categories' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    When you use Scrubadub, information may be stored on your browser in the form of cookies or local storage. You have the right under GDPR to decide which non-essential categories you want to allow.
                  </p>

                  {/* 1. Strictly Necessary */}
                  <div className="border border-slate-800 rounded-lg p-3.5 bg-[#0F172A]/60 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-semibold text-slate-200 text-xs">Strictly Necessary Cookies</span>
                        <span className="text-[9px] font-mono uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-1.5 py-0.2 rounded font-medium">
                          Always Active
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      These cookies and local storage items are essential for the application to function. They handle authentication with Firebase, prevent cross-site request forgery, and maintain security and session state. They cannot be turned off.
                    </p>
                  </div>

                  {/* 2. Functional */}
                  <div className="border border-slate-800 rounded-lg p-3.5 bg-[#0F172A]/60 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-semibold text-slate-200 text-xs">Functional Cookies</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.functional}
                          onChange={() => toggleCategory('functional')}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      These cookies enable helpful preferences and personalization, such as remembering your custom regular expression rules, active presets, and workspace layout between visits.
                    </p>
                  </div>

                  {/* 3. Performance & Analytics */}
                  <div className="border border-slate-800 rounded-lg p-3.5 bg-[#0F172A]/60 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-semibold text-slate-200 text-xs">Performance & Analytics Cookies</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.analytics}
                          onChange={() => toggleCategory('analytics')}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      These cookies help us understand how visitors use the application so we can measure throughput and fix crashes. All diagnostic data is aggregated, anonymized, and never tied to personal profiles.
                    </p>
                  </div>

                  {/* 4. Marketing */}
                  <div className="border border-slate-800 rounded-lg p-3.5 bg-[#0F172A]/60 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Cookie className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-semibold text-slate-200 text-xs">Marketing Cookies</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.marketing}
                          onChange={() => toggleCategory('marketing')}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Scrubadub does not display third-party advertisements or sell personal data. This category is included for compliance frameworks and is turned off by default.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: CCPA / CPRA NOTICE & OPT-OUT */}
              {activeTab === 'ccpa' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-lg bg-indigo-950/20 border border-indigo-900/40 text-slate-300 space-y-2">
                    <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                      <Scale className="w-4 h-4 text-indigo-400" />
                      <span>Notice for California Residents (CCPA / CPRA)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Under the California Consumer Privacy Act of 2018 (CCPA) and California Privacy Rights Act (CPRA), California residents have specific statutory rights concerning their personal information:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                      <li>The right to know what personal data is collected and processed.</li>
                      <li>The right to delete personal information.</li>
                      <li>The right to correct inaccurate personal information.</li>
                      <li>The right to opt-out of the "sale" or "sharing" of personal information.</li>
                      <li>The right to non-discrimination for exercising privacy rights.</li>
                    </ul>
                  </div>

                  {/* Do Not Sell Switch */}
                  <div className="border border-slate-800 rounded-lg p-4 bg-[#0F172A]/70 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-white text-xs">
                          Do Not Sell or Share My Personal Information
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                          Enable this toggle to explicitly exercise your statutory opt-out right. When enabled, all non-essential and marketing trackers are automatically blocked.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                        <input
                          type="checkbox"
                          checked={preferences.doNotSell}
                          onChange={(e) => handleDoNotSellToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    <div className="p-2.5 rounded bg-[#131B2E] border border-slate-800 text-[10px] text-emerald-400 font-mono flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Affirmation: Scrubadub does not sell or rent personal information to data brokers.</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-[#131B2E] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono flex-wrap">
                <a
                  href="https://github.com/MrTWrecks0208/Scrubadub/blob/main/Privacy-Policy.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 underline font-semibold inline-flex items-center gap-1"
                >
                  <span>Privacy Policy</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <span>•</span>
                <span>Preferences stored locally • Update anytime</span>
              </div>

              <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleRejectAll}
                  className="sm:w-[130px] h-7 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded text-[11px] font-medium transition-colors cursor-pointer inline-flex items-center justify-center whitespace-nowrap text-center"
                >
                  Reject non-essential
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="sm:w-[130px] h-7 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[11px] font-medium transition-colors cursor-pointer inline-flex items-center justify-center whitespace-nowrap text-center"
                >
                  Accept all
                </button>
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="sm:w-[130px] h-7 px-2 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 rounded text-[11px] font-medium transition-colors shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-center"
                >
                  <Check className="w-3 h-3" />
                  <span>Save choices</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
