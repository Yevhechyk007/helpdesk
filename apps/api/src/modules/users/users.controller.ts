import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { IsIn } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import type { UserRecord } from './users.service';

class UpdateRoleDto {
  @IsIn(['admin', 'agent', 'customer'])
  role: 'admin' | 'agent' | 'customer';
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@CurrentUser() user: UserRecord) {
    if (user.role === 'customer') {
      throw new ForbiddenException('Access denied');
    }
    return this.usersService.findAll();
  }

  @Patch(':id/role')
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: UserRecord,
  ) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can change roles');
    }
    return this.usersService.updateRole(id, dto.role);
  }
}
