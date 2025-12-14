import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  type AuthedRequest,
  SuccessResponse,
  validateAuth,
  validateBody,
} from '@/common';
import { AdditionalValidation } from '@/utils';

import { GameScoreService } from './game-score.service';
import {
  CreateGameScoreSchema,
  GameScorePaginateQuerySchema,
  type ICreateGameScore,
  type IGameScorePaginateQuery,
} from './schema';

export const GameScoreController = Router()
  .post(
    '/',
    validateAuth({}),
    validateBody({ schema: CreateGameScoreSchema }),
    async (
      request: AuthedRequest<{}, {}, ICreateGameScore>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const gameScore = await GameScoreService.createGameScore(
          request.body,
          request.user!.user_id,
        );
        const result = new SuccessResponse(
          StatusCodes.CREATED,
          'Game score saved successfully',
          gameScore,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/leaderboard/:game_id',
    async (
      request: Request<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const query = AdditionalValidation.validate(
          GameScorePaginateQuerySchema,
          request.query,
        );

        const leaderboard = await GameScoreService.getLeaderboard(
          request.params.game_id,
          query,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get leaderboard successfully',
          leaderboard.data,
          leaderboard.meta,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/best/:game_id',
    validateAuth({}),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const bestScore = await GameScoreService.getUserBestScore(
          request.params.game_id,
          request.user!.user_id,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get user best score successfully',
          bestScore,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  );

