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

import { MatchingPairService } from './matching-pair.service';
import {
  CheckMatchingPairSchema,
  CreateMatchingPairSchema,
  type ICheckMatchingPair,
  type ICreateMatchingPair,
  type IUpdateMatchingPair,
  UpdateMatchingPairSchema,
} from './schema';

export const MatchingPairController = Router()
  .post(
    '/',
    validateAuth({}),
    validateBody({
      schema: CreateMatchingPairSchema,
      file_fields: [
        { name: 'thumbnail_image', maxCount: 1 },
        { name: 'files_to_upload', maxCount: 32 },
      ],
    }),
    async (
      request: AuthedRequest<{}, {}, ICreateMatchingPair>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const newGame = await MatchingPairService.createMatchingPair(
          request.body,
          request.user!.user_id,
        );
        const result = new SuccessResponse(
          StatusCodes.CREATED,
          'Matching Pair game created',
          newGame,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        next(error);
      }
    },
  )
  .get(
    '/:game_id',
    validateAuth({}),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const game = await MatchingPairService.getMatchingPairDetail(
          request.params.game_id,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get game successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/:game_id/play/public',
    async (
      request: Request<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const game = await MatchingPairService.getMatchingPairPlay(
          request.params.game_id,
          true,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get public game successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/:game_id/play/private',
    validateAuth({}),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const game = await MatchingPairService.getMatchingPairPlay(
          request.params.game_id,
          true,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get private game successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .post(
    '/:game_id/check',
    validateBody({ schema: CheckMatchingPairSchema }),
    async (
      request: Request<{ game_id: string }, {}, ICheckMatchingPair>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const result = await MatchingPairService.checkAnswer(
          request.body,
          request.params.game_id,
        );
        const successResponse = new SuccessResponse(
          StatusCodes.OK,
          'Answer checked successfully',
          result,
        );

        return response
          .status(successResponse.statusCode)
          .json(successResponse.json());
      } catch (error) {
        next(error);
      }
    },
  )
  .patch(
    '/:game_id',
    validateAuth({}),
    validateBody({
      schema: UpdateMatchingPairSchema,
      file_fields: [
        { name: 'thumbnail_image', maxCount: 1 },
        { name: 'files_to_upload', maxCount: 32 },
      ],
    }),
    async (
      request: AuthedRequest<{ game_id: string }, {}, IUpdateMatchingPair>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const updatedGame = await MatchingPairService.updateMatchingPair(
          request.body,
          request.params.game_id,
          request.user!.user_id,
          request.user!.role,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Matching Pair game updated',
          updatedGame,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        next(error);
      }
    },
  )
  .delete(
    '/:game_id',
    validateAuth({}),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const result = await MatchingPairService.deleteMatchingPair(
          request.params.game_id,
          request.user!.user_id,
          request.user!.role,
        );

        const successResponse = new SuccessResponse(
          StatusCodes.OK,
          'Matching Pair game deleted successfully',
          result,
        );

        return response
          .status(successResponse.statusCode)
          .json(successResponse.json());
      } catch (error) {
        return next(error);
      }
    },
  );
