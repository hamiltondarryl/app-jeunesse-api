import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        // Si la réponse est une chaîne "ok" ou "success"
        if (data === 'ok' || data === 'success') {
          return { success: true, message: data };
        }
        // Si la réponse est null ou undefined
        if (data === undefined || data === null) {
          return { success: true };
        }
        // Sinon, retourner la donnée normale
        return data;
      })
    );
  }
}