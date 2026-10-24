import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, EntityManager, LessThan, Repository } from 'typeorm';

import { CreateRefreshTokenParams } from '../common/interfaces/refresh-token.interface.js';
import { RefreshTokenEntity } from './entities/refresh-token.entity.js';

@Injectable()
export class RefreshTokensRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly repo: Repository<RefreshTokenEntity>,
  ) {}

  async saveToken(
    params: CreateRefreshTokenParams,
    manager?: EntityManager,
  ): Promise<RefreshTokenEntity> {
    const repository = manager
      ? manager.getRepository(RefreshTokenEntity)
      : this.repo;
    const token = repository.create(params);
    return repository.save(token);
  }
  async findTokenById(
    id: string,
    manager?: EntityManager,
  ): Promise<RefreshTokenEntity | null> {
    const repository = manager
      ? manager.getRepository(RefreshTokenEntity)
      : this.repo;
    return repository.findOne({
      where: { id },
    });
  }
  async deleteTokenById(
    id: string,
    manager?: EntityManager,
  ): Promise<DeleteResult> {
    const repository = manager
      ? manager.getRepository(RefreshTokenEntity)
      : this.repo;
    return repository.delete(id);
  }

  async deleteAllTokensByUserId(
    userId: number,
    manager?: EntityManager,
  ): Promise<DeleteResult> {
    const repository = manager
      ? manager.getRepository(RefreshTokenEntity)
      : this.repo;
    return repository.delete({ userId });
  }

  async deleteExpiredTokens(before: Date): Promise<DeleteResult> {
    return this.repo.delete({ expiresAt: LessThan(before) });
  }
}
