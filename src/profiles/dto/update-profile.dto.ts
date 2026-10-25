import { OmitType, PartialType } from '@nestjs/swagger';
import { SignUpDto } from '../../auth/dto/sign-up.dto.js';

export class UpdateProfileDto extends PartialType(
  OmitType(SignUpDto, ['password']),
) {}
