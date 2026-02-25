import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        // If the response already has the expected format, return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Handle paginated responses
        if (data && typeof data === 'object' && 'data' in data && 'pagination' in data) {
          return {
            success: true,
            data: data.data,
            pagination: data.pagination,
          };
        }

        // Handle simple data responses
        return {
          success: true,
          data,
        };
      }),
    );
  }
}