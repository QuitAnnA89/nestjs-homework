import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';

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
    return await this.repo.save(token);
  }
  async findTokenById(id: string): Promise<RefreshTokenEntity | null> {
    const token = this.repo.findOne({
      where: {
        id,
      },
    });
    return token;
  }
  async deleteTokenById(id: string): Promise<DeleteResult> {
    const token = this.repo.delete(id);
    return token;
  }

  async deleteAllTokensByUserId(userId: number): Promise<DeleteResult> {
    const result = this.repo.delete({ userId });
    return result;
  }
}
