export class CreateUserDto {
  login: string;

  email: string;

  passwordHash: string;

  age?: number | null;

  description?: string | null;
}
