import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KaspiService } from './kaspi.service';
import { AuditService } from '../audit/audit.service';
import { Payment } from './payment.entity';
import { CasesService } from '../cases/cases.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly kaspiService: KaspiService,
    private readonly auditService: AuditService,
    private readonly casesService: CasesService,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(Payment) private readonly paymentsRepo: Repository<Payment>
  ) {}

  async createIntent(userId: string, amount: number, caseId: string) {
    const payment = await this.paymentsRepo.save(
      this.paymentsRepo.create({ userId, amount, caseId, status: 'pending', providerId: null, providerPaymentId: null })
    );

    const kaspiIntent = await this.kaspiService.createPayment(amount, payment.id);

    await this.auditService.log('payment.intent.created', userId, {
      paymentId: payment.id,
      caseId,
      amount,
      provider: 'kaspi'
    });

    return { ...kaspiIntent, paymentId: payment.id };
  }

  async handleWebhook(payload: { orderId: string; status: 'paid' | 'failed'; transactionId?: string }) {
    const payment = await this.paymentsRepo.findOne({ where: { id: payload.orderId } });
    if (!payment) return { received: true, message: 'payment not found' };

    if (payment.status === 'paid') {
      return { received: true, message: 'already processed' };
    }

    payment.status = payload.status;
    payment.providerId = payload.transactionId || payment.providerId;
    payment.providerPaymentId = payload.transactionId || payment.providerPaymentId;
    await this.paymentsRepo.save(payment);

    if (payload.status === 'paid') {
      await this.casesService.activateCase(payment.caseId);
      await this.notificationsService.create(payment.userId, 'Оплата подтверждена', 'Ваш платёж успешно обработан.');
      await this.auditService.log('payment.success', payment.userId, {
        paymentId: payment.id,
        caseId: payment.caseId,
        providerPaymentId: payment.providerPaymentId
      });
    }

    return { received: true };
  }

  findAllPayments() {
    return this.paymentsRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getDoctorEarnings(_doctorId: string) {
    const paid = await this.paymentsRepo.find({ where: { status: 'paid' } });
    const total = paid.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return { totalPaid: total, currency: 'KZT', count: paid.length };
  }

  getPartnerPayments(partnerId: string) {
    return this.paymentsRepo.find({ where: { userId: partnerId }, order: { createdAt: 'DESC' } });
  }

  getMyPayments(userId: string) {
    return this.paymentsRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }
}
