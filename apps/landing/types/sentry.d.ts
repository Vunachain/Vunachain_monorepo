/**
 * Ambient type declaration for @sentry/react.
 *
 * This file lets TypeScript compile cleanly when @sentry/react is absent from
 * node_modules (e.g. first-time installs where the lockfile is being rebuilt).
 * Once the package is installed these declarations are superseded by the
 * package's own bundled types, so they will never conflict in production.
 */

declare module '@sentry/react' {
  interface SentryInitOptions {
    dsn: string;
    integrations?: unknown[];
    tracesSampleRate?: number;
    replaysSessionSampleRate?: number;
    replaysOnErrorSampleRate?: number;
    [key: string]: unknown;
  }

  export function init(options: SentryInitOptions): void;
  export function browserTracingIntegration(): unknown;
  export function replayIntegration(options?: Record<string, unknown>): unknown;

}
