import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isDev = process.env.APP_STATUS === 'DEV';

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const raw =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = 'Une erreur interne est survenue.';
    let errors: Record<string, string> | undefined;
    if (typeof raw === 'string') {
      message = raw;
    } else if (raw && typeof raw === 'object') {
      if ('message' in raw) {
        const value = (raw as { message: string | string[] }).message;
        message = Array.isArray(value) ? value[0] : value;
      }
      if ('errors' in raw && (raw as { errors?: Record<string, string> }).errors) {
        errors = (raw as { errors: Record<string, string> }).errors;
      }
    }

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} → ${status}`);
      if (!isDev) {
        message = 'Une erreur interne est survenue.';
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: status >= 500 ? 'Erreur serveur' : 'Requête invalide',
      ...(errors ? { errors } : {}),
    });
  }
}
