import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-users.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findUserByLogin(login: string) {
    return await this.usersRepository.findUserByLogin(login);
  }
  async findUserByEmail(email: string) {
    return await this.usersRepository.findUserByEmail(email);
  }
  async createUser(dto: CreateUserDto) {
    return await this.usersRepository.createUser(dto);
  }
  async findUserByLoginWithPassword(login: string) {
    return await this.usersRepository.findUserByLoginWithPassword(login);
  }
  async findUserById(id: number) {
    const user = await this.usersRepository.findUserById(id);
    if (user === null) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }
    return user;
  }
  async getAllUsers(page?: number, limit?: number, login?: string) {
    page = page || 1;
    limit = limit || 10;
    const offset = page * limit - limit;
    const [result, total] = await this.usersRepository.findAllUsers(
      limit,
      offset,
      login,
    );
    const totalPages = Math.ceil(total / limit);
    return { data: result, page, limit, total, totalPages };
  }

  async deleteUserProfile(id: number) {
    const result = await this.usersRepository.softDeleteUser(id);

    if (result.affected === 0) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }
    return result;
  }
  async updateUserProfile(id: number, dto: UpdateUserDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Нет полей для обновления');
    }
    const result = await this.usersRepository.updateUser(id, dto);
    if (result.affected === 0) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }
    return await this.findUserById(id);
  }
}
