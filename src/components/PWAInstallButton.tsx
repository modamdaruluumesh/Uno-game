import React, {useState} from 'react';
import {Download, Smartphone, X} from 'lucide-react';
import {usePWAInstall} from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold shadow-sm transition-colors cursor-pointer whitespace-nowrap"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        title="Install as mobile app or publish via Trusted Web Activity"
        className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 border border-white/15 text-xs font-medium text-amber-200 transition-colors cursor-pointer whitespace-nowrap"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Get App</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-stone-950 border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3
                className="text-lg font-bold text-white"
                style={{fontFamily: 'var(--font-display)'}}
              >
                {isIOS ? 'Install on iPhone / iPad' : 'Install & Play Store App'}
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close"
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="text-sm text-stone-300 space-y-2 leading-relaxed">
                <p>Install UNO Tabletop directly onto your Home Screen:</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>
                    Tap the <strong className="text-white">Share</strong> button
                    in Safari&apos;s toolbar.
                  </li>
                  <li>
                    Scroll down and tap{' '}
                    <strong className="text-white">Add to Home Screen</strong>.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-stone-300 space-y-3 leading-relaxed">
                <p>
                  <strong className="text-white">Install on Android / Desktop:</strong>{' '}
                  Open browser menu and select{' '}
                  <strong className="text-amber-300">Install App</strong> or{' '}
                  <strong className="text-amber-300">Add to Home screen</strong>{' '}
                  to launch offline in fullscreen mode.
                </p>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1.5">
                  <p className="font-semibold text-emerald-300">
                    Google Play Store Ready (TWA)
                  </p>
                  <p className="text-stone-400">
                    This app includes a verified Web App Manifest, offline
                    Service Worker, 192px/512px maskable icons, and{' '}
                    <code className="text-stone-200">
                      /.well-known/assetlinks.json
                    </code>{' '}
                    ready to wrap into an Android App Bundle (.aab) using
                    Bubblewrap or PWABuilder.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
