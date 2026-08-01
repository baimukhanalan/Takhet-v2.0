import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AiService } from './ai.service';
import { AuthGuard } from '../auth/auth.guard';

class HealthInsightsDto {
  @IsString()
  @MinLength(2)
  @MaxLength(2000)
  query!: string;
}

class ChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(12000)
  message!: string;

  @IsString()
  @IsOptional()
  @MaxLength(8000)
  systemInstruction?: string;

  @IsBoolean()
  @IsOptional()
  useSearch?: boolean;
}

class SpeechDto {
  @IsString()
  @MinLength(1)
  @MaxLength(3000)
  text!: string;
}

class AnalyzeDto {
  @IsString()
  @MaxLength(120)
  type!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(8_000_000)
  data!: string;
}

class TranscribeDto {
  @IsString()
  @MinLength(16)
  @MaxLength(8_000_000)
  audio!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  mimeType!: string;
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('live-token')
  liveToken() {
    return this.aiService.createLiveToken();
  }

  @Post('health-insights')
  getHealthInsights(@Body() dto: HealthInsightsDto) {
    return this.aiService.getHealthInsights(dto.query);
  }

  @Post('public-health-insights')
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  getPublicHealthInsights(@Body() dto: HealthInsightsDto) {
    return this.aiService.getHealthInsights(dto.query);
  }

  @Post('public-chat')
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  async publicChat(@Body() dto: ChatDto) {
    return {
      text: await this.aiService.chat(dto.message, {
        systemInstruction: dto.systemInstruction,
        useSearch: Boolean(dto.useSearch)
      })
    };
  }

  @Post('public-chat-stream')
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  publicChatStream(@Body() dto: ChatDto, @Res() res: any) {
    return this.writeChatStream(dto, res);
  }

  @Post('public-speech')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async publicSpeech(@Body() dto: SpeechDto) {
    return {
      audio: await this.aiService.generateSpeech(dto.text)
    };
  }

  @Post('public-analyze')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  publicAnalyze(@Body() dto: AnalyzeDto) {
    return this.aiService.analyzeHealthData(dto.type, dto.data);
  }

  @Post('public-transcribe')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async publicTranscribe(@Body() dto: TranscribeDto) {
    return {
      text: await this.aiService.transcribeAudio(dto.audio, dto.mimeType)
    };
  }

  @Post('chat')
  @UseGuards(AuthGuard)
  async chat(@Body() dto: ChatDto) {
    return {
      text: await this.aiService.chat(dto.message, {
        systemInstruction: dto.systemInstruction,
        useSearch: Boolean(dto.useSearch)
      })
    };
  }

  @Post('chat-stream')
  @UseGuards(AuthGuard)
  chatStream(@Body() dto: ChatDto, @Res() res: any) {
    return this.writeChatStream(dto, res);
  }

  private async writeChatStream(dto: ChatDto, res: any) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      for await (const chunk of this.aiService.chatStream(dto.message, {
        systemInstruction: dto.systemInstruction,
        useSearch: Boolean(dto.useSearch)
      })) {
        res.write(chunk);
      }
    } catch (error) {
      if (!res.headersSent) {
        res.status(500);
      }
      res.write('\nНе удалось обработать запрос. Попробуйте ещё раз.');
    } finally {
      res.end();
    }
  }

  @Post('speech')
  @UseGuards(AuthGuard)
  async speech(@Body() dto: SpeechDto) {
    return {
      audio: await this.aiService.generateSpeech(dto.text)
    };
  }

  @Post('analyze')
  @UseGuards(AuthGuard)
  analyze(@Body() dto: AnalyzeDto) {
    return this.aiService.analyzeHealthData(dto.type, dto.data);
  }

  @Post('transcribe')
  @UseGuards(AuthGuard)
  async transcribe(@Body() dto: TranscribeDto) {
    return {
      text: await this.aiService.transcribeAudio(dto.audio, dto.mimeType)
    };
  }
}
