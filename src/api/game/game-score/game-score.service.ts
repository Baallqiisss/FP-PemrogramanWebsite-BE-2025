import { StatusCodes } from 'http-status-codes';

import { ErrorResponse, prisma } from '@/common';

import {
  type ICreateGameScore,
  type IGameScorePaginateQuery,
} from './schema';

export abstract class GameScoreService {
  static async createGameScore(
    data: ICreateGameScore,
    user_id: string,
  ) {
    // Verify game exists and is published
    const game = await prisma.games.findUnique({
      where: { id: data.game_id },
      select: { id: true, is_published: true },
    });

    if (!game || !game.is_published)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    // Create score record
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
    } catch (error: any) {
      // Check if it's a Prisma client error (model not found)
      if (error.code === 'P2001' || error.message?.includes('gameScores')) {
        throw new ErrorResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'GameScores model not found. Please run: npx prisma generate',
        );
      }
      throw error;
    }
  }

  static async getLeaderboard(
    game_id: string,
    query: IGameScorePaginateQuery,
  ) {
    // Verify game exists
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: { id: true, is_published: true },
    });

    if (!game)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    const skip = query.page > 0 ? query.per_page * (query.page - 1) : 0;

    const where = {
      game_id,
    };

    try {
      const [total, data] = await prisma.$transaction([
        prisma.gameScores.count({
          where,
        }),
        prisma.gameScores.findMany({
          where,
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
            { time_taken: 'asc' }, // Faster time is better
            { created_at: 'asc' }, // Earlier submission if tie
          ],
        }),
      ]);

      const lastPage = Math.ceil(total / query.per_page);

      return {
        data,
        meta: {
          total,
          lastPage,
          currentPage: query.page,
          perPage: query.per_page,
          page: query.page,
          per_page: query.per_page,
          total_pages: lastPage,
          prev: query.page > 1 ? query.page - 1 : null,
          next: query.page < lastPage ? query.page + 1 : null,
        },
      };
    } catch (error: any) {
      // Check if it's a Prisma client error (model not found)
      if (
        error.code === 'P2001' ||
        error.message?.includes('gameScores') ||
        error.message?.includes('model.count')
      ) {
        throw new ErrorResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'GameScores model not found. Please run: npx prisma generate && npx prisma migrate dev',
        );
      }
      throw error;
    }
  }

  static async getUserBestScore(game_id: string, user_id: string) {
    const bestScore = await prisma.gameScores.findFirst({
      where: {
        game_id,
        user_id,
      },
      orderBy: [
        { score: 'desc' },
        { time_taken: 'asc' },
      ],
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

    return bestScore;
  }
}

