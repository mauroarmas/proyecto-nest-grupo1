import { Type } from 'class-transformer';
import { IsOptional, IsPositive, IsString } from 'class-validator';

export class PaginationArgs {
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  perPage: number = 10;

  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsString()
  startDate: string

  @IsOptional()
  @IsString()
  endDate: string

  @IsOptional()
  @IsString()
  date: string
}