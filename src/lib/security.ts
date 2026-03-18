import { NextRequest } from 'next/server';

/**
 * Validate that the request origin matches the app URL.
 * Returns true if valid, false if suspicious.
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const allowedOrigins = [appUrl, 'http://localhost:3000', 'http://localhost:3001'];

  // Webhooks from Stripe/PayPal won't have origin — allow if no origin header
  if (!origin && !referer) return true;

  if (origin && allowedOrigins.some(a => origin.startsWith(a))) return true;
  if (referer && allowedOrigins.some(a => referer.startsWith(a))) return true;

  return false;
}

/**
 * Sanitize string input — strip HTML tags and trim
 */
export function sanitize(input: string | null | undefined): string {
  if (!input) return '';
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
