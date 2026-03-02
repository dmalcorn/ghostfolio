import { HasPermission } from '@ghostfolio/api/decorators/has-permission.decorator';
import { HasPermissionGuard } from '@ghostfolio/api/guards/has-permission.guard';
import { permissions } from '@ghostfolio/common/permissions';
import type { RequestWithUser } from '@ghostfolio/common/types';

import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Inject,
  InternalServerErrorException,
  Logger,
  Post,
  ServiceUnavailableException,
  UseGuards
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { AgentService, LlmUnavailableError } from './agent.service';
import {
  AgentResponse,
  ChatRequestDto,
  FeedbackRequestDto
} from './interfaces/agent.interfaces';

const MAX_MESSAGE_LENGTH = 10240; // 10KB

@Controller('agent')
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  public constructor(
    private readonly agentService: AgentService,
    @Inject(REQUEST) private readonly request: RequestWithUser
  ) {}

  @Post('chat')
  @HasPermission(permissions.accessAgentChat)
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'), HasPermissionGuard)
  public async chat(@Body() body: ChatRequestDto): Promise<AgentResponse> {
    const sanitizedMessage = this.sanitizeInput(body.message);

    if (!sanitizedMessage || sanitizedMessage.trim().length === 0) {
      throw new BadRequestException('Message is required');
    }

    if (sanitizedMessage.length > MAX_MESSAGE_LENGTH) {
      throw new BadRequestException(
        `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`
      );
    }

    try {
      return await this.agentService.chat(
        sanitizedMessage,
        body.conversationId,
        this.request.user
      );
    } catch (error) {
      if (error instanceof LlmUnavailableError) {
        throw new ServiceUnavailableException(error.message);
      }

      if (
        error instanceof BadRequestException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }

      this.logger.error('Unexpected error in agent chat', error);

      throw new InternalServerErrorException(
        'An unexpected error occurred. Please try again.'
      );
    }
  }

  @Post('feedback')
  @HasPermission(permissions.accessAgentChat)
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'), HasPermissionGuard)
  public async feedback(
    @Body() body: FeedbackRequestDto
  ): Promise<{ success: boolean }> {
    if (!body.conversationId || typeof body.conversationId !== 'string') {
      throw new BadRequestException('conversationId is required');
    }

    if (typeof body.messageIndex !== 'number' || body.messageIndex < 0) {
      throw new BadRequestException(
        'messageIndex must be a non-negative number'
      );
    }

    if (body.rating !== 'up' && body.rating !== 'down') {
      throw new BadRequestException('rating must be "up" or "down"');
    }

    try {
      await this.agentService.submitFeedback(
        body.conversationId,
        body.messageIndex,
        body.rating,
        this.request.user.id
      );

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to submit feedback', error);

      throw new InternalServerErrorException('Failed to submit feedback');
    }
  }

  private sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Strip control characters (except newlines and tabs)
    // eslint-disable-next-line no-control-regex
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }
}
