import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '../config/env.config';

export interface KaspiCreatePaymentResponse {
  orderId: string;
  amount: number;
  paymentUrl: string;
  provider: 'kaspi';
  status: 'pending';
}

@Injectable()
export class KaspiService {
  async createPayment(amount: number, orderId: string): Promise<KaspiCreatePaymentResponse> {
    const baseUrl = env.kaspiApiUrl || 'https://kaspi.kz/pay/api';

    return {
      orderId,
      amount,
      paymentUrl: `${baseUrl}/redirect?merchant_id=${encodeURIComponent(env.kaspiMerchantId)}&order_id=${encodeURIComponent(orderId)}&amount=${amount}`,
      provider: 'kaspi',
      status: 'pending'
    };
  }

  verifySignature(payload: { orderId: string; status: string; transactionId?: string }, signature?: string) {
    if (!env.kaspiSecretKey) return false;
    if (!signature) return false;

    const raw = `${payload.orderId}:${payload.status}:${payload.transactionId || ''}`;
    const expected = createHmac('sha256', env.kaspiSecretKey).update(raw).digest('hex');

    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;

    return timingSafeEqual(a, b);
  }
}
