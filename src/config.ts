export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
export const DEMO_MAX_SECONDS = 10;

// Purchase link for the full version. Empty in the full build so the URL is
// dropped from that bundle at build time.
export const BUY_URL = DEMO_MODE
  ? 'https://poeticsignal.lemonsqueezy.com/checkout/buy/9d1d5e7e-1cf8-4028-91ca-0d243de4be1e'
  : '';
