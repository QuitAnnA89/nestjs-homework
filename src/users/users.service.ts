import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
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
  async createUser(dto: CreateUserDto, manager?: EntityManager) {
    return await this.usersRepository.createUser(dto, manager);
  }
  async findUserByLoginWithPassword(login: string) {
    return await this.usersRepository.findUserByLoginWithPassword(login);
  }
  async findUserById(id: number) {
    const user = await this.usersRepository.findUserById(id);
    if (user === null) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
  }
  async getAllUsers(page: number, limit: number, login?: string) {
    const offset = page * limit - limit;
    const [result, total] = await this.usersRepository.findAllUsers(
      limit,
      offset,
      login,
    );
    const totalPages = Math.ceil(total / limit);
    return { data: result, page, limit, total, totalPages };
  }

  async deleteUserProfile(id: number, manager?: EntityManager) {
    const result = await this.usersRepository.softDeleteUser(id, manager);
    if (result.affected === 0) {
      throw new NotFoundException('Пользователь не найден');
    }
    return result;
  }
  async updateUserProfile(id: number, dto: UpdateUserDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Нет полей для обновления');
    }
    const result = await this.usersRepository.updateUser(id, dto);
    if (result.affected === 0) {
      throw new NotFoundException('Пользователь не найден');
    }
    return await this.findUserById(id);
  }
}
