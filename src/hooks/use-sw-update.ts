"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function useSwUpdate() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    )
      return;

    const wb = navigator.serviceWorker;

    // Listen for a new SW waiting to activate
    wb.ready.then((registration) => {
      // Check if there's already a waiting worker
      if (registration.waiting) {
        showUpdateToast(registration.waiting);
      }

      // Listen for future updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            showUpdateToast(newWorker);
          }
        });
      });
    });
  }, []);
}

function showUpdateToast(worker: ServiceWorker) {
  toast("Nueva version disponible", {
    description: "Actualiza para obtener las ultimas mejoras.",
    duration: Infinity,
    action: {
      label: "Actualizar",
      onClick: () => {
        worker.postMessage({ type: "SKIP_WAITING" });
        window.location.reload();
      },
    },
  });
}
