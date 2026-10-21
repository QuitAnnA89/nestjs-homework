import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { AccessTokenGuard } from '../common/guards/auth.guard.js';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface.js';
import { ProfileResponseDto } from './dto/profile-response.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ProfilesService } from './profiles.service.js';

@ApiBearerAuth()
@Controller('profile')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @ApiOkResponse({ type: ProfileResponseDto })
  @UseGuards(AccessTokenGuard)
  @Get('my')
  my(@CurrentUser() user: JwtPayload) {
    return this.profilesService.getProfile(user.id);
  }
  @UseGuards(AccessTokenGuard)
  @Delete('my')
  @HttpCode(204)
  deleteProfile(@CurrentUser() user: JwtPayload) {
    return this.profilesService.deleteProfile(user.id);
  }
  @ApiOkResponse({ type: ProfileResponseDto })
  @UseGuards(AccessTokenGuard)
  @Patch('my')
  @HttpCode(200)
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.updateProfile(user.id, dto);
  }
}
