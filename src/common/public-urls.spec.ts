import { resolvePublicUrls, parseFlatYaml } from './public-urls';

describe('public-urls', () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
    delete process.env.APP_DOMAIN;
    delete process.env.FRONTEND_URL;
    delete process.env.CORS_ORIGINS;
    delete process.env.APP_CONFIG_FILE;
  });

  it('parse un YAML plat', () => {
    const parsed = parseFlatYaml('domain: exemple.ga\nscheme: https\n');
    expect(parsed.domain).toBe('exemple.ga');
    expect(parsed.scheme).toBe('https');
  });

  it('dérive les URLs depuis APP_DOMAIN en production', () => {
    process.env.APP_STATUS = 'PROD';
    process.env.APP_DOMAIN = 'exemple.ga';
    const urls = resolvePublicUrls();
    expect(urls.frontendUrl).toBe('https://exemple.ga');
    expect(urls.apiUrl).toBe('https://exemple.ga/api');
    expect(urls.corsOrigins).toEqual(['https://exemple.ga', 'https://www.exemple.ga']);
  });
});
