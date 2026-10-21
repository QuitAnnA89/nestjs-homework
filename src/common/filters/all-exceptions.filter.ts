import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ErrorResponse } from '../interfaces/error-response.interface.js';
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : (res as { message: string | string[] }).message;
      const error = HttpStatus[status];
      const body: ErrorResponse = {
        statusCode: status,
        error,
        message,
        path: request.url,
        timestamp: new Date().toISOString(),
      };
      return response.status(status).json(body);
    }
    if (exception instanceof QueryFailedError) {
      const code = (exception.driverError as { code: string }).code;
      if (code === '23505') {
        const status = HttpStatus.CONFLICT;
        const message = 'Запись с такими данными уже существует';
        const error = HttpStatus[status];
        const body: ErrorResponse = {
          statusCode: status,
          error,
          message,
          path: request.url,
          timestamp: new Date().toISOString(),
        };
        return response.status(status).json(body);
      }
    }
    this.logger.error(exception);

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const error = HttpStatus[status];
    const message = 'Внутренняя ошибка сервера';
    const body: ErrorResponse = {
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };
    return response.status(status).json(body);
  }
}
