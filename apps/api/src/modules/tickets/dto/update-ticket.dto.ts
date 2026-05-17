import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateTicketDto {
  @IsNotEmpty()
  @IsIn(['new', 'open', 'in_progress', 'pending', 'resolved', 'closed'])
  status: 'new' | 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
}
