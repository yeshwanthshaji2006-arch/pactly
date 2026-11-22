"use client";

import { useEffect, useState } from "react";
import { Icon } from "./ui";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** "Install app" button: uses the browser's install prompt on Android/desktop Chrome, and shows steps on iPhone. */
export function InstallApp({ className = "" }: { className?: string }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || (!prompt && !ios)) return null;

  return (
    <div className={className}>
      <button
        type="button"
        className="btn btn-soft w-full"
        onClick={async () => {
          if (prompt) {
            await prompt.prompt();
            await prompt.userChoice.catch(() => null);
            setPrompt(null);
          } else setHelp(!help);
        }}
        data-testid="install-app"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" />
        </svg>
        Install Pactly app
      </button>
      {help ? (
        <p className="mt-2 flex items-start gap-1.5 rounded-[14px] bg-primary-soft p-3 text-xs text-primary">
          <Icon name="plus" className="mt-0.5 h-3.5 w-3.5" />
          In Safari, tap the Share button, then “Add to Home Screen”.
        </p>
      ) : null}
    </div>
  );
}
