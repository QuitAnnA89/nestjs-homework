import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from './pagination-query-param.dto.js';

export class FindUsersDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  @MaxLength(12)
  login?: string;
}
