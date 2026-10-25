import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AccessTokenGuard } from '../common/guards/auth.guard.js';
import { FindUsersDto } from './dto/find-users.dto.js';
import { UsersService } from './users.service.js';

@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AccessTokenGuard)
  getAllUsers(@Query() dto: FindUsersDto) {
    return this.usersService.getAllUsers(dto.page, dto.limit, dto.login);
  }
}
