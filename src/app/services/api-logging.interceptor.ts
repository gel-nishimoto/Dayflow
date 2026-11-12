import type { HttpInterceptorFn } from '@angular/common/http';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs';

import { environment } from '../../environments/environment';

/** Strip query string (may contain user ids) before logging. */
const safeUrl = (url: string): string => url.split('?')[0];

/** Best-effort classification of a failed request. Never includes bodies, headers or tokens. */
function classify(err: HttpErrorResponse): string {
  if (err.status === 0) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return 'NETWORK: device offline / DNS unreachable';
    }
    return (
      'NETWORK/CORS/SSL: no HTTP response reached the app. Likely causes: CORS rejection ' +
      '(missing Access-Control-Allow-Origin for the WebView origin), host anti-bot challenge page ' +
      'without CORS headers, invalid SSL certificate, or DNS failure.'
    );
  }
  if (err.status === 200 || err.status === 204) {
    return 'HTTP: 2xx but body is not valid JSON (host returned an HTML page, e.g. InfinityFree anti-bot/error page)';
  }
  if (err.status === 401 || err.status === 403) return 'AUTH: unauthorized / forbidden';
  if (err.status === 404) return 'HTTP: endpoint not found';
  if (err.status >= 500) return 'HTTP: server error (PHP/MySQL)';
  return `HTTP: status ${err.status}`;
}

/** Logs API URL, status and error details for requests to the Dayflow backend. */
export const apiLoggingInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }
  const started = Date.now();
  const origin = typeof location !== 'undefined' ? location.origin : 'n/a';

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          console.log(
            `[API] ${req.method} ${safeUrl(req.url)} -> ${event.status} (${Date.now() - started}ms)`,
          );
        }
      },
      error: (err: unknown) => {
        if (err instanceof HttpErrorResponse) {
          console.error(
            `[API] ${req.method} ${safeUrl(req.url)} FAILED status=${err.status} ` +
              `statusText="${err.statusText}" origin=${origin} (${Date.now() - started}ms) :: ${classify(err)}`,
          );
        } else {
          console.error(`[API] ${req.method} ${safeUrl(req.url)} FAILED`, err);
        }
      },
    }),
  );
};

