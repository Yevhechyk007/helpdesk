import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class UpdateTicketDto {
  @IsOptional()
  @IsIn(['new', 'open', 'in_progress', 'pending', 'resolved', 'closed'])
  status?: 'new' | 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';

  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}
