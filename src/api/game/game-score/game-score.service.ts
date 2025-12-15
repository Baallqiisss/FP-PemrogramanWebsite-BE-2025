import { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { ErrorResponse, prisma } from '@/common';

import { type ICreateGameScore, type IGameScorePaginateQuery } from './schema';

function isPrismaKnownError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export abstract class GameScoreService {
  static async createGameScore(data: ICreateGameScore, user_id: string) {
    const game = await prisma.games.findUnique({
      where: { id: data.game_id },
      select: { id: true, is_published: true },
    });

    if (!game || !game.is_published) {
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');
    }

    try {
      const gameScore = await prisma.gameScores.create({
        data: {
          user_id,
          game_id: data.game_id,
          score: data.score,
          max_combo: data.max_combo ?? 0,
          time_taken: data.time_taken,
          matched_pairs: data.matched_pairs,
          total_pairs: data.total_pairs,
        },
        select: {
          id: true,
          score: true,
          max_combo: true,
          time_taken: true,
          created_at: true,
        },
      });

      return gameScore;
    } catch (error: unknown) {
      if (isPrismaKnownError(error) && error.code === 'P2001') {
        throw new ErrorResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'GameScores model not found. Please run: npx prisma generate',
        );
      }

      throw error;
    }
  }
  static async getLeaderboard(game_id: string, query: IGameScorePaginateQuery) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: { id: true },
    });

    if (!game) {
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');
    }

    const skip = query.page > 0 ? query.per_page * (query.page - 1) : 0;

    try {
      const [total, data] = await prisma.$transaction([
        prisma.gameScores.count({ where: { game_id } }),
        prisma.gameScores.findMany({
          where: { game_id },
          skip,
          take: query.per_page,
          select: {
            id: true,
            score: true,
            max_combo: true,
            time_taken: true,
            matched_pairs: true,
            total_pairs: true,
            created_at: true,
            user: {
              select: {
                id: true,
                username: true,
                profile_picture: true,
              },
            },
          },
          orderBy: [
            { score: 'desc' },
            { time_taken: 'asc' },
            { created_at: 'asc' },
          ],
        }),
      ]);

      const lastPage = Math.ceil(total / query.per_page);

      return {
        data,
        meta: {
          total,
          currentPage: query.page,
          perPage: query.per_page,
          lastPage,
          prev: query.page > 1 ? query.page - 1 : null,
          next: query.page < lastPage ? query.page + 1 : null,
        },
      };
    } catch (error: unknown) {
      if (isPrismaKnownError(error) && error.code === 'P2001') {
        throw new ErrorResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'GameScores model not found. Please run: npx prisma generate && npx prisma migrate dev',
        );
      }

      throw error;
    }
  }

  static async getUserBestScore(game_id: string, user_id: string) {
    return prisma.gameScores.findFirst({
      where: { game_id, user_id },
      orderBy: [{ score: 'desc' }, { time_taken: 'asc' }],
      select: {
        id: true,
        score: true,
        max_combo: true,
        time_taken: true,
        matched_pairs: true,
        total_pairs: true,
        created_at: true,
      },
    });
  }
}
