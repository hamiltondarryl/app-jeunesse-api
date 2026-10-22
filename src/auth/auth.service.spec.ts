import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivityLogService } from 'src/activity-log/activity-log.service';
import { MailService } from 'src/mail/mail.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: JwtService, useValue: { sign: jest.fn() } },
        { provide: ActivityLogService, useValue: { create: jest.fn() } },
        { provide: MailService, useValue: { sendPasswordReset: jest.fn() } },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('génère un code de reset cryptographique de 8 caractères', () => {
    const code = service.generateResetCode();
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[A-Z2-9]+$/);
    expect(service.generateResetCode()).not.toBe(code);
  });
});
