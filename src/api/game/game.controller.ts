// import {
//   type NextFunction,
//   type Request,
//   type Response,
//   Router,
// } from 'express';
// import { StatusCodes } from 'http-status-codes';

// import {
//   type AuthedRequest,
//   SuccessResponse,
//   validateAuth,
//   validateBody,
// } from '@/common';
// import { AdditionalValidation } from '@/utils';

// import { GameService } from './game.service';
// import { gameListRouter } from './game-list/game-list.router';
// import { GameScoreController } from './game-score/game-score.controller';
// import {
//   GamePaginateQuerySchema,
//   GameTemplateQuerySchema,
//   type IUpdateLikeCount,
//   type IUpdatePlayCount,
//   type IUpdatePublishStatus,
//   UpdateLikeCountSchema,
//   UpdatePlayCountSchema,
//   UpdatePublishStatusSchema,
// } from './schema';

import { Router } from 'express';

// Exporting a router to satisfy src/api/router.ts usage
export const GameController = Router();
