// Google Cloud Fraud Defense / Invisible reCAPTCHA Helper
// Implements the Google Invisible reCAPTCHA specification:
// https://developers.google.com/recaptcha/docs/invisible

export const RECAPTCHA_SITE_KEY =
  import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LcgANUtAAAAAAtGLeSlryui2CbdDOe4VvAH0M8R';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      render: (
        container: HTMLElement | string,
        parameters: {
          sitekey: string;
          size?: 'invisible' | 'normal' | 'compact';
          badge?: 'bottomright' | 'bottomleft' | 'inline';
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: (err?: any) => void;
          isolated?: boolean;
        }
      ) => number;
      execute: (opt_widget_id?: number) => void | Promise<void>;
      reset: (opt_widget_id?: number) => void;
      getResponse: (opt_widget_id?: number) => string;
    };
  }
}

/**
 * Ensures the Google reCAPTCHA script is loaded on the document.
 */
export function ensureRecaptchaLoaded(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve();

    if (window.grecaptcha && window.grecaptcha.render) {
      window.grecaptcha.ready(() => resolve());
      return;
    }

    const existingScript = document.querySelector('script[src*="recaptcha/api.js"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.grecaptcha) {
          window.grecaptcha.ready(() => resolve());
        } else {
          resolve();
        }
      };
      script.onerror = () => {
        console.warn('Could not load reCAPTCHA script from Google.');
        resolve();
      };
      document.head.appendChild(script);
    } else {
      // Poll briefly for grecaptcha ready
      const interval = setInterval(() => {
        if (window.grecaptcha && window.grecaptcha.render) {
          clearInterval(interval);
          window.grecaptcha.ready(() => resolve());
        }
      }, 50);

      // Max 4s timeout fallback
      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, 4000);
    }
  });
}

export interface RenderOptions {
  badge?: 'bottomright' | 'bottomleft' | 'inline';
  onVerify?: (token: string) => void;
  onError?: (err?: any) => void;
  onExpired?: () => void;
}

/**
 * Programmatically renders an invisible reCAPTCHA widget onto an element or container ID.
 */
export async function renderInvisibleRecaptcha(
  container: HTMLElement | string,
  options: RenderOptions = {}
): Promise<number | null> {
  await ensureRecaptchaLoaded();

  if (!window.grecaptcha || typeof window.grecaptcha.render !== 'function') {
    console.warn('reCAPTCHA library not yet initialized.');
    return null;
  }

  try {
    const widgetId = window.grecaptcha.render(container, {
      sitekey: RECAPTCHA_SITE_KEY,
      size: 'invisible',
      badge: options.badge || 'bottomright',
      callback: (token: string) => {
        options.onVerify?.(token);
      },
      'error-callback': (err) => {
        console.warn('reCAPTCHA error callback:', err);
        options.onError?.(err);
      },
      'expired-callback': () => {
        console.warn('reCAPTCHA response expired.');
        options.onExpired?.();
      }
    });

    return widgetId;
  } catch (err) {
    console.warn('reCAPTCHA render caught error:', err);
    return null;
  }
}

/**
 * Programmatically invokes the invisible challenge and returns the verification token.
 * If reCAPTCHA is not loaded or fails, it resolves gracefully so user actions are not permanently blocked.
 */
export function executeInvisibleRecaptcha(
  widgetId: number | null,
  timeoutMs = 12000
): Promise<string | null> {
  return new Promise((resolve) => {
    if (widgetId === null || !window.grecaptcha) {
      // Not initialized; return null
      resolve(null);
      return;
    }

    let isResolved = false;

    // Timeout safety
    const timer = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        console.warn('reCAPTCHA challenge execution timed out.');
        resolve(null);
      }
    }, timeoutMs);

    try {
      // Check if there is already a response
      const existingResponse = window.grecaptcha.getResponse(widgetId);
      if (existingResponse) {
        clearTimeout(timer);
        isResolved = true;
        resolve(existingResponse);
        return;
      }

      // Re-bind listener or execute
      window.grecaptcha.execute(widgetId);

      // Poll briefly for response token
      const checkInterval = setInterval(() => {
        if (isResolved) {
          clearInterval(checkInterval);
          return;
        }
        if (window.grecaptcha) {
          const resp = window.grecaptcha.getResponse(widgetId);
          if (resp) {
            clearTimeout(timer);
            clearInterval(checkInterval);
            isResolved = true;
            resolve(resp);
          }
        }
      }, 100);
    } catch (err) {
      clearTimeout(timer);
      console.warn('Error executing reCAPTCHA widget:', err);
      resolve(null);
    }
  });
}

/**
 * Resets the reCAPTCHA widget to accept a new response.
 */
export function resetInvisibleRecaptcha(widgetId: number | null): void {
  if (widgetId !== null && window.grecaptcha && typeof window.grecaptcha.reset === 'function') {
    try {
      window.grecaptcha.reset(widgetId);
    } catch (e) {
      console.warn('Error resetting reCAPTCHA:', e);
    }
  }
}

/**
 * Optionally verifies the token against your backend API.
 */
export async function verifyRecaptchaWithServer(token: string): Promise<boolean> {
  if (!token) return true;
  try {
    const res = await fetch('/api/verify-recaptcha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    if (!res.ok) return true; // Fail open if endpoint is unavailable
    const data = await res.json();
    return data.success !== false;
  } catch (err) {
    console.warn('Server reCAPTCHA verification skipped or offline:', err);
    return true; // Fail open
  }
}
