import { type NextFunction, type Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  type AuthedRequest,
  ErrorResponse,
  SuccessResponse,
  validateAuth,
  validateBody,
} from '@/common';

import { AnagramService } from './anagram.service';
import {
  CheckAnagramAnswerSchema,
  CreateAnagramSchema,
  type ICheckAnagramAnswer,
  type ICreateAnagram,
  type IUpdateAnagram,
  UpdateAnagramSchema,
} from './schema';
import { GameIdSchema } from './schema/game-parameters.schema';

/* =======================
   Utils
======================= */
const validateGameId = (parameters: unknown): string => {
  const validationResult = GameIdSchema.safeParse(parameters);

  if (!validationResult.success) {
    throw new ErrorResponse(
      StatusCodes.BAD_REQUEST,
      'Invalid game ID format (must be UUID)',
    );
  }

  return validationResult.data.game_id;
};

const handleError = (next: NextFunction, error: unknown) => {
  if (error instanceof Error) {
    return next(error);
  }

  return next(new Error('Unknown error occurred'));
};

/* =======================
   Controller
======================= */
export const AnagramController = Router()
  // CREATE GAME
  .post(
    '/',
    validateAuth({}),
    validateBody({
      schema: CreateAnagramSchema,
      file_fields: [
        { name: 'thumbnail_image', maxCount: 1 },
        { name: 'files_to_upload', maxCount: 20 },
      ],
    }),
    async (
      request: AuthedRequest<{}, {}, ICreateAnagram>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const newGame = await AnagramService.createAnagram(
          request.body,
          request.user!.user_id,
        );

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const result = new SuccessResponse(
          StatusCodes.CREATED,
          'Anagram game created',
          newGame,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return handleError(next, error);
      }
    },
  )

  // GET GAME DETAIL
  .get(
    '/:game_id',
    validateAuth({}),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const gameId = validateGameId(request.params);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const game = await AnagramService.getAnagramGameDetail(
          gameId,
          request.user!.user_id,
          request.user!.role,
        );

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get game successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return handleError(next, error);
      }
    },
  )

  // PLAY PUBLIC GAME
  .get(
    '/:game_id/play/public',
    validateAuth({}),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const gameId = validateGameId(request.params);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const game = await AnagramService.getAnagramPlay(gameId, true);

        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get public game play successfully',
          game,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return handleError(next, error);
      }
    },
  )

  // UPDATE GAME
  .patch(
    '/:game_id',
    validateAuth({}),
    validateBody({
      schema: UpdateAnagramSchema,
      file_fields: [
        { name: 'thumbnail_image', maxCount: 1 },
        { name: 'files_to_upload', maxCount: 20 },
      ],
    }),
    async (
      request: AuthedRequest<{ game_id: string }, {}, IUpdateAnagram>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const gameId = validateGameId(request.params);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const updatedGame = await AnagramService.updateAnagram(
          request.body,
          gameId,
          request.user!.user_id,
          request.user!.role,
        );

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Anagram game updated',
          updatedGame,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return handleError(next, error);
      }
    },
  )

  // CHECK ANSWER
  .post(
    '/:game_id/check',
    validateAuth({}),
    validateBody({ schema: CheckAnagramAnswerSchema }),
    async (
      request: AuthedRequest<{ game_id: string }, {}, ICheckAnagramAnswer>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const gameId = validateGameId(request.params);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const result = await AnagramService.checkAnagramAnswer(
          request.body,
          gameId,
        );

        const successResponse = new SuccessResponse(
          StatusCodes.OK,
          'Anagram answer checked successfully',
          result,
        );

        return response
          .status(successResponse.statusCode)
          .json(successResponse.json());
      } catch (error) {
        return handleError(next, error);
      }
    },
  )

  // DELETE GAME
  .delete(
    '/:game_id',
    validateAuth({}),
    async (
      request: AuthedRequest<{ game_id: string }>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const gameId = validateGameId(request.params);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const result = await AnagramService.deleteAnagram(
          gameId,
          request.user!.user_id,
          request.user!.role,
        );

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const successResponse = new SuccessResponse(
          StatusCodes.OK,
          'Anagram game deleted successfully',
          result,
        );

        return response
          .status(successResponse.statusCode)
          .json(successResponse.json());
      } catch (error) {
        return handleError(next, error);
      }
    },
  );
