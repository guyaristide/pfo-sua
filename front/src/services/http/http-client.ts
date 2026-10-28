import { AppError, type AppErrorKind } from '@/shared/errors';
import { sessionStore } from './session-store';
import { sessionEvents } from '../session-events';

/**
 * Le client HTTP unique. Il porte la session, met en file les requêtes pendant un rafraîchissement
 * (règle 16) et normalise toute réponse d'erreur en AppError (règle 17). Les deux 404 ne se confondent
 * pas (règle 19) : une route absente est signalée par le serveur avec l'en-tête `X-Route-Missing`,
 * sinon un 404 désigne une ressource.
 */
export interface HttpClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  refreshToken?: () => Promise<string | null>;
}

export class HttpClient {
  private refreshing: Promise<string | null> | null = null;

  constructor(private readonly options: HttpClientOptions) {}

  async get<T>(path: string, signal?: AbortSignal): Promise<T> {
    return this.request<T>('GET', path, undefined, signal);
  }

  async post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
    return this.request<T>('POST', path, body, signal);
  }

  private async request<T>(method: string, path: string, body?: unknown, signal?: AbortSignal, retried = false): Promise<T> {
    const fetchImpl = this.options.fetchImpl ?? fetch;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = sessionStore.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let response: Response;
    try {
      response = await fetchImpl(`${this.options.baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? null : JSON.stringify(body),
        ...(signal ? { signal } : {}),
      });
    } catch (cause) {
      throw new AppError('network', { cause });
    }

    if (response.status === 401 && !retried && this.options.refreshToken) {
      const fresh = await this.refreshOnce();
      if (fresh) return this.request<T>(method, path, body, signal, true);
    }

    if (response.status === 401) {
      sessionStore.setToken(null);
      sessionEvents.emitLost();
    }
    if (!response.ok) throw await this.toAppError(response);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  /** Dix 401 simultanés déclenchent un seul rafraîchissement ; les autres attendent son résultat. */
  private refreshOnce(): Promise<string | null> {
    if (!this.refreshing) {
      this.refreshing = this.options
        .refreshToken!()
        .then(token => {
          sessionStore.setToken(token);
          return token;
        })
        .finally(() => {
          this.refreshing = null;
        });
    }
    return this.refreshing;
  }

  private async toAppError(response: Response): Promise<AppError> {
    let payload: { code?: string; message?: string; reference?: string } = {};
    try {
      payload = (await response.json()) as typeof payload;
    } catch {
      // Corps absent ou non JSON : l'erreur se qualifie par le statut seul.
    }
    const kind = kindFromStatus(response);
    const options: { reference?: string; userMessage?: string } = {};
    if (payload.reference) options.reference = payload.reference;
    if (kind === 'business' || kind === 'validation') {
      if (payload.message) options.userMessage = payload.message;
    }
    return new AppError(kind, options);
  }
}

function kindFromStatus(response: Response): AppErrorKind {
  switch (response.status) {
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return response.headers.get('X-Route-Missing') ? 'route-missing' : 'resource-missing';
    case 409:
    case 422:
      return response.status === 422 ? 'validation' : 'business';
    default:
      return 'unexpected';
  }
}
