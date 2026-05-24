import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { IsOptional, IsBoolean, IsInt, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserRecord } from '../users/users.service';
import { NotificationsService } from './notifications.service';

class ListNotificationsQuery {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : 20))
  limit?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  unreadOnly?: boolean;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @Query() query: ListNotificationsQuery,
    @CurrentUser() user: UserRecord,
  ) {
    const limit = query.limit ?? 20;
    const unreadOnly = query.unreadOnly ?? false;
    return this.notificationsService.findAll(user.id, limit, unreadOnly);
  }

  @Patch(':id/read')
  markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserRecord,
  ) {
    return this.notificationsService.markRead(id, user.id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(@CurrentUser() user: UserRecord) {
    return this.notificationsService.markAllRead(user.id);
  }
}
