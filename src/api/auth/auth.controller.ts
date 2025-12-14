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

import { GameService } from '../game/game.service';
import { GamePaginateQuerySchema } from '../game/schema';
import { AuthService } from './auth.service';
import {
  type IChangePassword,
  type ILogin,
  type IRegister,
  type IUpdateMe,
  ChangePasswordSchema,
  LoginSchema,
  RegisterSchema,
  UpdateMeSchema,
} from './schema';

export const AuthController = Router()
  .post(
    '/register',
    validateBody({
      schema: RegisterSchema,
      file_fields: [{ name: 'profile_picture', maxCount: 1 }],
    }),
    async (
      request: Request<{}, {}, IRegister>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        await AuthService.register(request.body);
        const result = new SuccessResponse(
          StatusCodes.CREATED,
          'Account created successfully',
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .post(
    '/login',
    validateBody({
      schema: LoginSchema,
    }),
    async (
      request: Request<{}, {}, ILogin>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const token = await AuthService.login(request.body);
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Logged in successfully',
          token,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/me',
    validateAuth({}),
    async (request: AuthedRequest, response: Response, next: NextFunction) => {
      try {
        const data = await AuthService.getMe(request.user!.user_id);
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get user data successfully',
          data,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .get(
    '/me/game',
    validateAuth({}),
    async (request: AuthedRequest, response: Response, next: NextFunction) => {
      try {
        const query = AdditionalValidation.validate(
          GamePaginateQuerySchema,
          request.query,
        );

        const games = await GameService.getAllGame(
          query,
          true,
          request.user!.user_id,
          request.user!.user_id,
        );
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Get all user game (private) successfully',
          games.data,
          games.meta,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .patch(
    '/me',
    validateAuth({}),
    validateBody({
      schema: UpdateMeSchema,
      file_fields: [{ name: 'profile_picture', maxCount: 1 }],
    }),
    async (
      request: AuthedRequest<{}, {}, IUpdateMe>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        const data = await AuthService.updateMe(request.user!.user_id, request.body);
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Profile updated successfully',
          data,
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  )
  .patch(
    '/me/password',
    validateAuth({}),
    validateBody({
      schema: ChangePasswordSchema,
    }),
    async (
      request: AuthedRequest<{}, {}, IChangePassword>,
      response: Response,
      next: NextFunction,
    ) => {
      try {
        await AuthService.changePassword(request.user!.user_id, request.body);
        const result = new SuccessResponse(
          StatusCodes.OK,
          'Password changed successfully',
        );

        return response.status(result.statusCode).json(result.json());
      } catch (error) {
        return next(error);
      }
    },
  );
