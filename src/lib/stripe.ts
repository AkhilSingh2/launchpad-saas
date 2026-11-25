import Stripe from "stripe";

let client: Stripe | null = null;

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export function stripeCheckoutConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_PRO &&
      process.env.STRIPE_PRICE_TEAM,
  );
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured.");
  if (!client) client = new Stripe(key);
  return client;
}

export function stripePriceIds() {
  return {
    pro: process.env.STRIPE_PRICE_PRO || undefined,
    team: process.env.STRIPE_PRICE_TEAM || undefined,
  };
}

export function appBaseUrl() {
  return process.env.BETTER_AUTH_URL || "http://localhost:3000";
}
