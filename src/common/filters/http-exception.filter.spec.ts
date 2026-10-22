import { HttpException, HttpStatus } from '@nestjs/common';
import { AppExceptionFilter } from './http-exception.filter';

describe('AppExceptionFilter', () => {
  const previous = process.env.APP_STATUS;

  afterEach(() => {
    process.env.APP_STATUS = previous;
  });

  function capture(exception: unknown) {
    process.env.APP_STATUS = 'PROD';
    const filter = new AppExceptionFilter();
    const state: { status?: number; body?: Record<string, unknown> } = {};
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({
          status(code: number) {
            state.status = code;
            return this;
          },
          json(body: Record<string, unknown>) {
            state.body = body;
          },
        }),
        getRequest: () => ({ method: 'GET', url: '/api/secret' }),
      }),
    };
    filter.catch(exception, host as never);
    return state;
  }

  it('masque le détail d’une erreur interne', () => {
    const state = capture(new Error('mot de passe postgres en clair'));
    expect(state.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(state.body?.message).toBe('Une erreur interne est survenue.');
    expect(JSON.stringify(state.body)).not.toContain('postgres');
    expect(state.body?.stack).toBeUndefined();
  });

  it('conserve le message métier d’une erreur de validation', () => {
    const state = capture(new HttpException({ message: 'Données invalides.' }, 400));
    expect(state.status).toBe(400);
    expect(state.body?.message).toBe('Données invalides.');
  });
});
