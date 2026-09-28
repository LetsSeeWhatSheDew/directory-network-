// Globals the site reads off window: Google Analytics' gtag (loaded in the
// root layout). Typed here so components don't need `window as any`.
export {};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}
