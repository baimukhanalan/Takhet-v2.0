import { Body, Controller, Headers, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { PaymentsService } from './payments.service';
import { KaspiService } from './kaspi.service';

class CreateIntentDto {
  @IsString()
  caseId!: string;
}

class KaspiWebhookDto {
  @IsString()
  orderId!: string;

  @IsIn(['paid', 'failed'])
  status!: 'paid' | 'failed';

  @IsOptional()
  @IsString()
  transactionId?: string;
}

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly kaspiService: KaspiService
  ) {}

  @UseGuards(AuthGuard)
  @Post('create-intent')
  createIntent(@Req() req: any, @Body() dto: CreateIntentDto) {
    return this.paymentsService.createIntent(req.user.id, dto.caseId);
  }

  @Post('webhook')
  webhook(@Headers('x-kaspi-signature') signature: string | undefined, @Body() dto: KaspiWebhookDto) {
    const isValid = this.kaspiService.verifySignature(dto, signature);
    if (!isValid) throw new UnauthorizedException('Invalid Kaspi webhook signature');
    return this.paymentsService.handleWebhook(dto);
  }
}
