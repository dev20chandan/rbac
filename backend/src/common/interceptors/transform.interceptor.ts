import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
    timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
        const response = context.switchToHttp().getResponse();
        return next.handle().pipe(
            map((data) => {
                const result = data as any;
                return {
                    success: true,
                    statusCode: response.statusCode,
                    message: result?.message || 'Success',
                    data: result?.data !== undefined ? result.data : result,
                    timestamp: new Date().toISOString(),
                };
            }),
        );
    }
}
