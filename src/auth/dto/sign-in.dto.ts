import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SignInDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  login: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  password: string;
}
