import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserRecord } from '../users/users.service';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ListTicketsDto } from './dto/list-tickets.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTicketDto, @CurrentUser('id') userId: string) {
    return this.ticketsService.create(dto, userId);
  }

  @Get()
  findAll(@Query() query: ListTicketsDto, @CurrentUser() user: UserRecord) {
    return this.ticketsService.findAll(query, user.id, user.role);
  }

  // Specific sub-routes must come BEFORE /:id to avoid shadowing
  @Get(':id/activity')
  getActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserRecord,
  ) {
    return this.ticketsService.getActivity(id, user.id, user.role);
  }

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: UserRecord,
  ) {
    return this.ticketsService.addComment(id, dto, user.id, user.role);
  }

  @Patch(':id')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
    @CurrentUser() user: UserRecord,
  ) {
    return this.ticketsService.updateStatus(id, dto, user.id, user.role);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserRecord,
  ) {
    return this.ticketsService.findOne(id, user.id, user.role);
  }
}
