import { csrfMiddleware } from './csrf.middleware';
import { CSRF_COOKIE, SESSION_COOKIE } from '../auth/auth-cookie';

function run(method: string, path: string, cookies: Record<string, string> = {}, header?: string) {
  const req = {
    method,
    path,
    url: path,
    cookies,
    get: (name: string) => (name === 'x-csrf-token' ? header : undefined),
  };
  const state: { status?: number; body?: unknown; next: boolean } = { next: false };
  const res = {
    status(code: number) {
      state.status = code;
      return this;
    },
    json(body: unknown) {
      state.body = body;
    },
  };
  csrfMiddleware(req as never, res as never, () => {
    state.next = true;
  });
  return state;
}

describe('csrfMiddleware', () => {
  it('laisse passer une lecture', () => {
    expect(run('GET', '/api/organisation').next).toBe(true);
  });

  it('laisse passer la connexion sans session', () => {
    expect(run('POST', '/api/auth/login-admin').next).toBe(true);
  });

  it('refuse une écriture authentifiée sans jeton', () => {
    const state = run('PATCH', '/api/organisation/1', { [SESSION_COOKIE]: 'session' });
    expect(state.next).toBe(false);
    expect(state.status).toBe(403);
  });

  it('accepte une écriture dont le jeton correspond au cookie', () => {
    const state = run(
      'POST',
      '/api/auth/logout',
      { [SESSION_COOKIE]: 'session', [CSRF_COOKIE]: 'meme-jeton' },
      'meme-jeton',
    );
    expect(state.next).toBe(true);
  });
});
