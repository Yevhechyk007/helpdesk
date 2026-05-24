import {
  Controller,
  Get,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserRecord } from '../users/users.service';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  getSummary(@CurrentUser() user: UserRecord) {
    if (user.role !== 'admin' && user.role !== 'agent') {
      throw new ForbiddenException('Access denied');
    }
    return this.analyticsService.getSummary();
  }
}
