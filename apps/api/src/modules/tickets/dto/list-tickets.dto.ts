import { IsOptional, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ListTicketsDto {
  @IsOptional()
  @IsIn(['new', 'open', 'in_progress', 'pending', 'resolved', 'closed'])
  status?: 'new' | 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';

  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'critical'])
  priority?: 'low' | 'medium' | 'high' | 'critical';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
