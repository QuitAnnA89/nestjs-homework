import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository, UpdateResult } from 'typeorm';
import { CreateUserDto } from './dto/create-users.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserEntity } from './entities/user.entity.js';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async findUserByLogin(login: string): Promise<UserEntity | null> {
    const user = await this.repo.findOne({ where: { login } });
    return user;
  }

  async findUserByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.repo.findOne({ where: { email } });
    return user;
  }

  async findUserByLoginWithPassword(login: string): Promise<UserEntity | null> {
    const user = await this.repo.findOne({
      where: { login },
      select: { id: true, passwordHash: true },
    });
    return user;
  }

  async createUser(dto: CreateUserDto): Promise<UserEntity> {
    const user = this.repo.create(dto);
    return await this.repo.save(user);
  }

  async findUserById(id: number): Promise<UserEntity | null> {
    const user = await this.repo.findOne({
      where: { id },
      select: {
        id: true,
        login: true,
        email: true,
        age: true,
        description: true,
      },
    });
    return user;
  }

  async findAllUsers(
    take: number,
    skip: number,
    login?: string,
  ): Promise<[UserEntity[], number]> {
    const [result, total] = await this.repo.findAndCount({
      where: login ? { login: ILike(`%${login}%`) } : {},
      take: take,
      skip: skip,
      order: { id: 'ASC' },
      select: {
        id: true,
        login: true,
        email: true,
        age: true,
        description: true,
      },
    });
    return [result, total];
  }
  async softDeleteUser(id: number): Promise<UpdateResult> {
    const result = await this.repo.softDelete(id);
    return result;
  }

  async updateUser(id: number, dto: UpdateUserDto): Promise<UpdateResult> {
    const result = await this.repo.update(id, dto);
    return result;
  }
}
