import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string | string[] = 'Internal server error';
        let error = 'Internal Server Error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                const res = exceptionResponse as any;
                message = res.message || message;
                error = res.error || error;
            }
        } else if (exception instanceof Error) {
            // Handle MongoDB duplicate key errors
            if ((exception as any).code === 11000) {
                status = HttpStatus.CONFLICT;
                const keyValue = (exception as any).keyValue;
                const field = Object.keys(keyValue || {})[0] || 'field';
                message = `${field} already exists`;
                error = 'Conflict';
            } else {
                this.logger.error(exception.message, exception.stack);
            }
        }

        response.status(status).json({
            success: false,
            statusCode: status,
            error,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}
