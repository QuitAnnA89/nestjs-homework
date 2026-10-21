import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class SignUpDto {
  @IsString()
  @IsNotEmpty({ message: 'Поле обязательно для заполнения' })
  @MaxLength(12, { message: 'Логин не должен превышать 12 символов' })
  login: string;

  @IsEmail({}, { message: 'Некорректный формат электронной почты ' })
  @IsNotEmpty({ message: 'Поле обязательно для заполнения' })
  @MaxLength(30, { message: 'Email не должен превышать 30 символов' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Поле обязательно для заполнения' })
  @MinLength(6, { message: 'Пароль не может быть меньше 6 символов' })
  @MaxLength(64, { message: 'Пароль не должен превышать 64 символа' })
  password: string;

  @IsInt({ message: 'Число должно быть целым' })
  @IsOptional()
  @Min(1, { message: 'Возраст не может быть меньше 1' })
  @Max(120, { message: 'Возраст не может быть больше 120' })
  age?: number | null;

  @IsString()
  @MaxLength(1000, { message: 'Описание не должно превышать 1000 символов' })
  @IsOptional()
  description?: string | null;
}
