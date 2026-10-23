import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, LessThan, Repository } from 'typeorm';

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
  ): Promise<RefreshTokenEntity> {
    const token = this.repo.create(params);
    return this.repo.save(token);
  }
  async findTokenById(id: string): Promise<RefreshTokenEntity | null> {
    return this.repo.findOne({
      where: { id },
    });
  }
  async deleteTokenById(id: string): Promise<DeleteResult> {
    return this.repo.delete(id);
  }

  async deleteAllTokensByUserId(userId: number): Promise<DeleteResult> {
    return this.repo.delete({ userId });
  }

  async deleteExpiredTokens(before: Date): Promise<DeleteResult> {
    return this.repo.delete({ expiresAt: LessThan(before) });
  }
}
