import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  ILike,
  IsNull,
  Repository,
  UpdateResult,
} from 'typeorm';
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
    return this.repo.findOne({ where: { login } });
  }

  async findUserByEmail(email: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findUserByLoginWithPassword(login: string): Promise<UserEntity | null> {
    return this.repo.findOne({
      where: { login },
      select: { id: true, passwordHash: true },
    });
  }

  async createUser(
    dto: CreateUserDto,
    manager?: EntityManager,
  ): Promise<UserEntity> {
    const repository = manager ? manager.getRepository(UserEntity) : this.repo;
    const user = repository.create(dto);
    return repository.save(user);
  }

  async findUserById(id: number): Promise<UserEntity | null> {
    return this.repo.findOne({
      where: { id },
      select: {
        id: true,
        login: true,
        email: true,
        age: true,
        description: true,
      },
    });
  }

  async findAllUsers(
    take: number,
    skip: number,
    login?: string,
  ): Promise<[UserEntity[], number]> {
    const escaped = login?.replace(/[\\%_]/g, '\\$&');
    return this.repo.findAndCount({
      where: login ? { login: ILike(`%${escaped}%`) } : {},
      take: take,
      skip: skip,
      order: { id: 'ASC' },
      select: {
        id: true,
        login: true,
        age: true,
        description: true,
      },
    });
  }
  async softDeleteUser(
    id: number,
    manager?: EntityManager,
  ): Promise<UpdateResult> {
    const repository = manager ? manager.getRepository(UserEntity) : this.repo;
    return repository.softDelete({ id, deletedAt: IsNull() });
  }

  async updateUser(id: number, dto: UpdateUserDto): Promise<UpdateResult> {
    return this.repo.update({ id, deletedAt: IsNull() }, dto);
  }
}
