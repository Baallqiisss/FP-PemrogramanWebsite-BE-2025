import { type Prisma, type ROLE } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { v4 } from 'uuid';

import { ErrorResponse, type IMatchingPairJson, prisma } from '@/common';
import { FileManager } from '@/utils';

import {
  type ICheckMatchingPair,
  type ICreateMatchingPair,
  type IUpdateMatchingPair,
} from './schema';

export abstract class MatchingPairService {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private static MATCHING_PAIR_SLUG = 'matching-pair';

  static async createMatchingPair(data: ICreateMatchingPair, user_id: string) {
    await this.existGameCheck(data.name);

    const newGameId = v4();
    const gameTemplateId = await this.getGameTemplateId();

    const thumbnailImagePath = await FileManager.upload(
      `game/matching-pair/${newGameId}`,
      data.thumbnail_image,
    );

    const imageArray: string[] = [];

    if (data.files_to_upload) {
      for (const image of data.files_to_upload) {
        const newImagePath = await FileManager.upload(
          `game/matching-pair/${newGameId}`,
          image,
        );
        imageArray.push(newImagePath);
      }
    }

    const gameJson: IMatchingPairJson = {
      countdown: data.countdown,
      score_per_match: data.score_per_match,
      images: imageArray,
    };

    const newGame = await prisma.games.create({
      data: {
        id: newGameId,
        game_template_id: gameTemplateId,
        creator_id: user_id,
        name: data.name,
        description: data.description,
        thumbnail_image: thumbnailImagePath,
        is_published: data.is_publish_immediately,
        game_json: gameJson as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
      },
    });

    return newGame;
  }

  static async getMatchingPairDetail(
    game_id: string,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
        game_json: true,
        creator_id: true,
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (!game || game.game_template.slug !== this.MATCHING_PAIR_SLUG)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'User cannot get this game data',
      );

    const gameJson = game.game_json as unknown as IMatchingPairJson | null;

    if (!gameJson)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game data not found');

    return {
      id: game.id,
      name: game.name,
      description: game.description,
      thumbnail_image: game.thumbnail_image,
      is_published: game.is_published,
      countdown: gameJson.countdown,
      score_per_match: gameJson.score_per_match,
      images: gameJson.images,
    };
  }

  static async getMatchingPairPlay(
    game_id: string,
    is_public: boolean,
    user_id?: string,
    user_role?: ROLE,
  ) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
        game_json: true,
        creator_id: true,
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (
      !game ||
      (is_public && !game.is_published) ||
      game.game_template.slug !== this.MATCHING_PAIR_SLUG
    )
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    if (
      !is_public &&
      user_role !== 'SUPER_ADMIN' &&
      game.creator_id !== user_id
    )
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'User cannot get this game data',
      );

    const gameJson = game.game_json as unknown as IMatchingPairJson | null;

    if (!gameJson)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game data not found');

    // Duplicate images to make pairs
    const imagesWithId = gameJson.images.map((img, index) => ({
      id: index,
      image: img,
    }));
    const deck = [...imagesWithId, ...imagesWithId];

    // Shuffle images
    this.shuffleArray(deck);

    return {
      id: game.id,
      name: game.name,
      description: game.description,
      thumbnail_image: game.thumbnail_image,
      countdown: gameJson.countdown,
      score_per_match: gameJson.score_per_match,
      images: deck,
      is_published: game.is_published,
    };
  }

  static async checkAnswer(data: ICheckMatchingPair, game_id: string) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        game_json: true,
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (!game || game.game_template.slug !== this.MATCHING_PAIR_SLUG)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    const gameJson = game.game_json as unknown as IMatchingPairJson;
    const totalImages = gameJson.images.length;

    // Validate IDs
    const uniqueMatchedIds = new Set(data.matched_pair_ids);

    if (uniqueMatchedIds.size !== data.matched_pair_ids.length) {
      // Duplicate IDs sent, which is suspicious but we can just ignore duplicates or throw error.
      // Let's just use unique ones.
    }

    for (const id of uniqueMatchedIds) {
      if (id < 0 || id >= totalImages) {
        throw new ErrorResponse(
          StatusCodes.BAD_REQUEST,
          `Invalid image ID: ${id}`,
        );
      }
    }

    const correctCount = uniqueMatchedIds.size;
    const score = correctCount * gameJson.score_per_match;
    const maxScore = totalImages * gameJson.score_per_match;
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

    return {
      game_id,
      total_pairs: totalImages,
      matched_pairs_count: correctCount,
      score,
      max_score: maxScore,
      percentage: Math.round(percentage * 100) / 100,
    };
  }

  static async updateMatchingPair(
    data: IUpdateMatchingPair,
    game_id: string,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        thumbnail_image: true,
        game_json: true,
        creator_id: true,
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (!game || game.game_template.slug !== this.MATCHING_PAIR_SLUG)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'User cannot update this game',
      );

    if (data.name) await this.existGameCheck(data.name, game_id);

    let thumbnailImagePath = game.thumbnail_image;

    if (data.thumbnail_image) {
      await FileManager.remove(game.thumbnail_image);
      thumbnailImagePath = await FileManager.upload(
        `game/matching-pair/${game_id}`,
        data.thumbnail_image,
      );
    }

    const oldGameJson = game.game_json as unknown as IMatchingPairJson;
    const oldImages = oldGameJson.images || [];
    let newImages: string[] = [];

    // Handle existing images
    if (data.existing_images) {
      newImages = data.existing_images.filter(img => oldImages.includes(img));
    } else if (data.existing_images === undefined && !data.files_to_upload) {
      // If both are undefined, keep old images? Or if existing_images is undefined but files_to_upload is present?
      // Usually if existing_images is not provided, we assume we keep all? Or none?
      // In quiz, we map questions. Here we have a list.
      // If existing_images is missing, we should probably keep all old images if we are not replacing the list.
      // But if we want to remove images, we must send the list of images to keep.
      // Let's assume if existing_images is NOT provided, we keep ALL old images.
      newImages = [...oldImages];
    } else {
      // existing_images is undefined, but files_to_upload is present.
      // If user wants to clear all old images, they should send empty array for existing_images.
      // If they send nothing, we keep old images.
      newImages = [...oldImages];
    }

    // If existing_images IS provided (even empty), we used that filtered list above.
    // Wait, my logic above: if (data.existing_images) -> use it.
    // if (data.existing_images === undefined) -> keep all.
    // This seems correct for partial updates.

    // Handle new files
    if (data.files_to_upload) {
      for (const image of data.files_to_upload) {
        const newImagePath = await FileManager.upload(
          `game/matching-pair/${game_id}`,
          image,
        );
        newImages.push(newImagePath);
      }
    }

    // Check if we have too many images
    if (newImages.length > 32) {
      // Cleanup uploaded files if error?
      // For now just throw error.
      throw new ErrorResponse(StatusCodes.BAD_REQUEST, 'Max 32 images allowed');
    }

    // Identify removed images to delete from storage
    const removedImages = oldImages.filter(img => !newImages.includes(img));

    for (const img of removedImages) {
      await FileManager.remove(img);
    }

    const gameJson: IMatchingPairJson = {
      countdown: data.countdown ?? oldGameJson.countdown,
      score_per_match: data.score_per_match ?? oldGameJson.score_per_match,
      images: newImages,
    };

    const updatedGame = await prisma.games.update({
      where: { id: game_id },
      data: {
        name: data.name,
        description: data.description,
        thumbnail_image: thumbnailImagePath,
        is_published: data.is_publish,
        game_json: gameJson as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
      },
    });

    return updatedGame;
  }

  static async deleteMatchingPair(
    game_id: string,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        thumbnail_image: true,
        game_json: true,
        creator_id: true,
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (!game || game.game_template.slug !== this.MATCHING_PAIR_SLUG)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'User cannot delete this game',
      );

    const gameJson = game.game_json as unknown as IMatchingPairJson | null;
    const imagesToDelete: string[] = [];

    if (gameJson?.images) {
      imagesToDelete.push(...gameJson.images);
    }

    if (game.thumbnail_image) imagesToDelete.push(game.thumbnail_image);

    for (const path of imagesToDelete) {
      await FileManager.remove(path);
    }

    await prisma.games.delete({ where: { id: game_id } });

    return { id: game_id };
  }

  private static async existGameCheck(game_name?: string, game_id?: string) {
    const where: Record<string, unknown> = {};
    if (game_name) where.name = game_name;
    if (game_id) where.id = game_id;

    if (Object.keys(where).length === 0) return null;

    const game = await prisma.games.findFirst({
      where,
      select: { id: true, creator_id: true },
    });

    if (game)
      throw new ErrorResponse(
        StatusCodes.BAD_REQUEST,
        'Game name is already exist',
      );

    return game;
  }

  private static async getGameTemplateId() {
    const result = await prisma.gameTemplates.findUnique({
      where: { slug: this.MATCHING_PAIR_SLUG },
      select: { id: true },
    });

    if (!result)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game template not found');

    return result.id;
  }

  private static shuffleArray<T>(array: T[]): T[] {
    for (let index = array.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
    }

    return array;
  }
}
