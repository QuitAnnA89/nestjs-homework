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
import { PG_UNIQUE_VIOLATION } from './postgres-errors.js';
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
      return response
        .status(status)
        .json(this.buildBody(status, message, request));
    }
    if (exception instanceof QueryFailedError) {
      const code = (exception.driverError as { code: string }).code;
      if (code === PG_UNIQUE_VIOLATION) {
        const status = HttpStatus.CONFLICT;
        const message = 'Запись с такими данными уже существует';
        return response
          .status(status)
          .json(this.buildBody(status, message, request));
      }
    }
    this.logger.error(exception);

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message = 'Внутренняя ошибка сервера';
    return response
      .status(status)
      .json(this.buildBody(status, message, request));
  }
  private buildBody(
    status: number,
    message: string | string[],
    request: Request,
  ): ErrorResponse {
    return {
      statusCode: status,
      error: HttpStatus[status],
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };
  }
}
