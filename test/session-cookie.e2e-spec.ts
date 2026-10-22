import { Controller, INestApplication, Post, Req, Res } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Request, Response } from 'express';
import cookieParser = require('cookie-parser');
import * as request from 'supertest';
import { CSRF_COOKIE, SESSION_COOKIE, setAuthCookies } from '../src/auth/auth-cookie';
import { createCsrfToken, csrfMiddleware } from '../src/common/csrf.middleware';

@Controller('demo')
class DemoController {
  @Post('ouvrir')
  ouvrir(@Res({ passthrough: true }) res: Response) {
    setAuthCookies(res, 'session-de-test', createCsrfToken());
    return { ok: true };
  }

  @Post('ecrire')
  ecrire(@Req() req: Request) {
    return { session: Boolean(req.cookies?.[SESSION_COOKIE]) };
  }
}

describe('Session par cookie (fonctionnel)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.APP_STATUS = 'DEV';
    const moduleRef = await Test.createTestingModule({
      controllers: [DemoController],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.use(csrfMiddleware);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('refuse une écriture authentifiée sans jeton CSRF', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/demo/ouvrir').expect(201);
    await agent.post('/api/demo/ecrire').expect(403);
  });

  it('accepte l’écriture quand le navigateur renvoie le jeton CSRF', async () => {
    const agent = request.agent(app.getHttpServer());
    const opened = await agent.post('/api/demo/ouvrir').expect(201);
    const raw = opened.headers['set-cookie'] as unknown as string[];
    const csrfCookie = raw.find((item) => item.startsWith(`${CSRF_COOKIE}=`));
    const csrf = csrfCookie?.split(';')[0].split('=').slice(1).join('=');

    const response = await agent
      .post('/api/demo/ecrire')
      .set('X-CSRF-Token', csrf || '')
      .expect(201);

    expect(response.body.session).toBe(true);
  });
});
