'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const FIRST_VISIT_KEY = 'tvia_first_visit_guide_dismissed';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showFirstVisitGuide, setShowFirstVisitGuide] = useState(false);
  const promptFiredRef = useRef(false);


  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOSDevice(isIOS);

    // Listen for the install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      promptFiredRef.current = true;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show first-visit guide after a moment if no install prompt available
    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem(FIRST_VISIT_KEY);
      if (!promptFiredRef.current && !isIOS && !dismissed) {
        setShowFirstVisitGuide(true);
      }
    }, 1500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, []);

  // Register Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registrado:', reg.scope);
        })
        .catch((err) => {
          console.error('Error al registrar Service Worker:', err);
        });
    }
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOSDevice) {
      setShowIOSGuide(true);
    }
  }, [deferredPrompt, isIOSDevice]);

  const handleDismissFirstGuide = useCallback(() => {
    setShowFirstVisitGuide(false);
    localStorage.setItem(FIRST_VISIT_KEY, 'true');
  }, []);

  // Don't render if already installed and no toast to show
  if (isInstalled && !showToast) return null;

  // Don't render if nothing to show
  if (!deferredPrompt && !isIOSDevice && !showToast && !showFirstVisitGuide) return null;

  return (
    <>
      {/* Install Button */}
      {!isInstalled && (deferredPrompt || isIOSDevice) && (
        <motion.button
          onClick={handleInstallClick}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="install-pwa-button"
          title="Descargar App"
          aria-label="Descargar aplicación"
          id="install-pwa-btn"
        >
          {/* Download icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="install-pwa-label">Descargar App</span>

          {/* Pulse ring */}
          <span className="install-pwa-pulse" />
        </motion.button>
      )}

      {/* iOS Installation Guide Modal */}
      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            className="ios-guide-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowIOSGuide(false)}
          >
            <motion.div
              className="ios-guide-card"
              initial={{ opacity: 0, y: 60, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="ios-guide-close"
                onClick={() => setShowIOSGuide(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>

              <div className="ios-guide-icon">📲</div>
              <h3 className="ios-guide-title">Instalar en iPhone/iPad</h3>
              
              <div className="ios-guide-steps">
                <div className="ios-guide-step">
                  <div className="ios-guide-step-number">1</div>
                  <p>Toca el botón <strong>Compartir</strong> <span style={{ fontSize: '20px' }}>⬆️</span> en Safari</p>
                </div>
                <div className="ios-guide-step">
                  <div className="ios-guide-step-number">2</div>
                  <p>Desplázate y selecciona <strong>&quot;Agregar a pantalla de inicio&quot;</strong></p>
                </div>
                <div className="ios-guide-step">
                  <div className="ios-guide-step-number">3</div>
                  <p>Toca <strong>&quot;Agregar&quot;</strong> para confirmar</p>
                </div>
              </div>

              <button
                className="ios-guide-ok"
                onClick={() => setShowIOSGuide(false)}
              >
                ¡Entendido!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* First Visit Guide Modal */}
      <AnimatePresence>
        {showFirstVisitGuide && (
          <motion.div
            className="ios-guide-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismissFirstGuide}
          >
            <motion.div
              className="ios-guide-card"
              initial={{ opacity: 0, y: 60, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="ios-guide-close"
                onClick={handleDismissFirstGuide}
                aria-label="Cerrar"
              >
                ✕
              </button>

              <div className="ios-guide-icon">📲</div>
              <h3 className="ios-guide-title">Instalar la App</h3>

              <div className="ios-guide-steps">
                <div className="ios-guide-step">
                  <div className="ios-guide-step-number">1</div>
                  <p><strong>Refresca la página</strong> para activar el botón de instalación</p>
                </div>
                <div className="ios-guide-step">
                  <div className="ios-guide-step-number">2</div>
                  <p>Presiona el botón <strong>&quot;Descargar App&quot;</strong> que aparecerá abajo</p>
                </div>
                <div className="ios-guide-step">
                  <div className="ios-guide-step-number">3</div>
                  <p>Confirma para agregar la app a tu dispositivo</p>
                </div>
              </div>

              <button
                className="ios-guide-ok"
                onClick={handleDismissFirstGuide}
              >
                ¡Entendido!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            className="install-toast"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
          >
            <span className="install-toast-icon">✅</span>
            <span>¡App instalada correctamente!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
