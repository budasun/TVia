'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'tvia_ios_prompt_dismissed';

/**
 * Detects if user is on iOS Safari (not in standalone mode)
 * and shows a proactive install banner automatically.
 */
export default function IOSInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't run on server
    if (typeof window === 'undefined') return;

    // Check if already running as standalone (installed PWA)
    const isStandalone =
      ('standalone' in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone) ||
      window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);

    // Detect Safari (not Chrome/Firefox/etc on iOS — though they all use WebKit,
    // we specifically look for Safari UI as only Safari supports A2HS)
    const isSafari = /safari/.test(ua) && !/crios|fxios|opios|mercury/.test(ua);

    if (!isIOS || !isSafari) return;

    // Check if user previously dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      // Check if dismissal was more than 7 days ago — show again
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Show after a short delay to avoid interrupting initial load
    const timer = setTimeout(() => setShow(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Subtle backdrop */}
          <motion.div
            className="ios-prompt-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
          />

          {/* Floating banner */}
          <motion.div
            className="ios-prompt-banner"
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Close button */}
            <button
              className="ios-prompt-close"
              onClick={handleDismiss}
              aria-label="Cerrar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* App icon */}
            <div className="ios-prompt-app-icon">
              <img
                src="/favicon/web-app-manifest-192x192.png"
                alt="TVideoIA"
                width={56}
                height={56}
              />
            </div>

            {/* Content */}
            <div className="ios-prompt-content">
              <h4 className="ios-prompt-title">Instalar TVideoIA</h4>
              <p className="ios-prompt-subtitle">Accede más rápido desde tu pantalla de inicio</p>

              {/* Steps */}
              <div className="ios-prompt-steps">
                <div className="ios-prompt-step">
                  <div className="ios-prompt-step-icon">
                    {/* Share icon (Apple style) */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  </div>
                  <span>Toca <strong>Compartir</strong> en la barra de Safari</span>
                </div>

                <div className="ios-prompt-step-divider" />

                <div className="ios-prompt-step">
                  <div className="ios-prompt-step-icon">
                    {/* Plus square icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </div>
                  <span>Selecciona <strong>&quot;Agregar a Inicio&quot;</strong></span>
                </div>
              </div>
            </div>

            {/* Pointer triangle (points down toward Safari bar) */}
            <div className="ios-prompt-pointer" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
