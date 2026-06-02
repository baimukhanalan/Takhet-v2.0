import { Body, Controller, Post, Res } from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AiService } from './ai.service';

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
  @IsIn(['lab', 'image', 'symptoms', 'document'])
  type!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  data!: string;
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('health-insights')
  getHealthInsights(@Body() dto: HealthInsightsDto) {
    return this.aiService.getHealthInsights(dto.query);
  }

  @Post('chat')
  async chat(@Body() dto: ChatDto) {
    return {
      text: await this.aiService.chat(dto.message, {
        systemInstruction: dto.systemInstruction,
        useSearch: Boolean(dto.useSearch)
      })
    };
  }

  @Post('chat-stream')
  async chatStream(@Body() dto: ChatDto, @Res() res: any) {
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
  async speech(@Body() dto: SpeechDto) {
    return {
      audio: await this.aiService.generateSpeech(dto.text)
    };
  }

  @Post('analyze')
  analyze(@Body() dto: AnalyzeDto) {
    return this.aiService.analyzeHealthData(dto.type, dto.data);
  }
}
