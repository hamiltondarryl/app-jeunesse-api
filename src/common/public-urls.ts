import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export type PublicUrls = {
  domain: string;
  scheme: string;
  frontendUrl: string;
  apiUrl: string;
  corsOrigins: string[];
};

export function resolvePublicUrls(): PublicUrls {
  const file = loadUrlConfig();
  const isDev = process.env.APP_STATUS === 'DEV';
  const domain = stripHost(process.env.APP_DOMAIN || file.domain);
  const scheme = (process.env.APP_SCHEME || file.scheme || (isDev ? 'http' : 'https'))
    .replace(':', '')
    .trim();
  const frontendUrl = rtrimSlash(
    process.env.FRONTEND_URL || file.frontendUrl || (domain ? `${scheme}://${domain}` : ''),
  );
  const apiPath = file.apiPath || '/api';
  const normalizedPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  const apiUrl = rtrimSlash(
    process.env.API_URL ||
      file.apiUrl ||
      (frontendUrl ? `${frontendUrl}${normalizedPath}` : ''),
  );

  const corsOrigins = parseList(process.env.CORS_ORIGINS || file.corsOrigins);
  if (!corsOrigins.length && frontendUrl) {
    corsOrigins.push(frontendUrl);
    const includeWww = (file.includeWww || 'true').toLowerCase() !== 'false';
    if (includeWww && domain && !domain.startsWith('www.')) {
      corsOrigins.push(`${scheme}://www.${domain}`);
    }
  }

  if (!isDev && (!frontendUrl || !corsOrigins.length)) {
    throw new Error(
      'URLs publiques manquantes : renseigner `domain` (et éventuellement frontendUrl, apiUrl, corsOrigins) dans config/app.yaml ou /etc/jeunesse/app.yaml.',
    );
  }

  return {
    domain,
    scheme,
    frontendUrl: frontendUrl || 'http://localhost:4200',
    apiUrl: apiUrl || 'http://localhost:4000/api',
    corsOrigins: corsOrigins.length
      ? corsOrigins
      : ['http://localhost:4200', 'http://127.0.0.1:4200'],
  };
}

function loadUrlConfig(): Record<string, string> {
  const candidates = [
    process.env.APP_CONFIG_FILE,
    '/etc/jeunesse/app.yaml',
    join(process.cwd(), 'config/app.yaml'),
  ];
  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) {
      return parseFlatYaml(readFileSync(candidate, 'utf8'));
    }
  }
  return {};
}

export function parseFlatYaml(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const idx = line.indexOf(':');
    if (idx <= 0) {
      continue;
    }
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function parseList(raw?: string): string[] {
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function stripHost(value?: string): string {
  return (value || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '');
}

function rtrimSlash(value: string): string {
  return value.replace(/\/+$/, '');
}
