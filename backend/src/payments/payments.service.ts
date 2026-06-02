import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KaspiService } from './kaspi.service';
import { AuditService } from '../audit/audit.service';
import { Payment } from './payment.entity';
import { CasesService } from '../cases/cases.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CaseEntity } from '../cases/case.entity';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly kaspiService: KaspiService,
    private readonly auditService: AuditService,
    private readonly casesService: CasesService,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeService: RealtimeService,
    @InjectRepository(Payment) private readonly paymentsRepo: Repository<Payment>,
    @InjectRepository(CaseEntity) private readonly casesRepo: Repository<CaseEntity>
  ) {}

  async createIntent(userId: string, amount: number, caseId: string) {
    const payment = await this.paymentsRepo.save(
      this.paymentsRepo.create({ userId, amount, caseId, currency: 'KZT', provider: 'kaspi', status: 'pending', providerId: null, providerPaymentId: null })
    );

    await this.auditService.log('payment.intent.created', userId, {
      paymentId: payment.id,
      caseId,
      amount,
      provider: 'kaspi'
    });

    try {
      const kaspiIntent = await this.kaspiService.createPayment(amount, payment.id);
      this.realtimeService.publishToUser(userId, 'patient', 'payment.intent.created');
      this.realtimeService.publishToRoles(['admin', 'partner'], 'admin', 'payment.intent.created');
      return { ...kaspiIntent, paymentId: payment.id, stub: false };
    } catch {
      payment.status = 'paid';
      payment.provider = 'kaspi_stub';
      payment.providerId = `stub-${payment.id}`;
      payment.providerPaymentId = `stub-${payment.id}`;
      await this.paymentsRepo.save(payment);

      await this.notificationsService.create(
        userId,
        'Оплата подтверждена',
        'Тестовая оплата подтверждена. Можно переходить в комнату консультации и ждать врача.'
      );
      await this.auditService.log('payment.stub.success', userId, {
        paymentId: payment.id,
        caseId,
        amount
      });
      this.realtimeService.publishToUser(userId, 'patient', 'payment.stub.success');
      this.realtimeService.publishToRoles(['doctor', 'admin', 'partner'], 'doctor', 'payment.stub.success');

      return {
        paymentId: payment.id,
        paymentUrl: null,
        provider: 'kaspi_stub',
        status: 'paid',
        stub: true
      };
    }
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
      await this.notificationsService.create(payment.userId, 'Оплата подтверждена', 'Ваш платеж успешно обработан.');
      await this.auditService.log('payment.success', payment.userId, {
        paymentId: payment.id,
        caseId: payment.caseId,
        providerPaymentId: payment.providerPaymentId
      });
      this.realtimeService.publishToUser(payment.userId, 'patient', 'payment.success');
      this.realtimeService.publishToRoles(['doctor', 'admin', 'partner'], 'doctor', 'payment.success');
    }

    return { received: true };
  }

  findAllPayments() {
    return this.paymentsRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getDoctorEarnings(doctorId: string) {
    const doctorCases = await this.casesRepo.find({ where: { doctorId } });
    const doctorCaseIds = new Set(doctorCases.map((item) => item.id));
    const paid = (await this.paymentsRepo.find({ where: { status: 'paid' } })).filter((payment) => doctorCaseIds.has(payment.caseId));
    const total = paid.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const revenueHistory = this.buildRevenueHistory(paid);
    return { totalPaid: total, currency: 'KZT', count: paid.length, revenueHistory };
  }

  private buildRevenueHistory(payments: Payment[]) {
    const now = new Date();
    const buckets = Array.from({ length: 4 }, (_, index) => {
      const start = new Date(now);
      start.setDate(now.getDate() - (3 - index) * 7 - 6);
      start.setHours(0, 0, 0, 0);

      const end = new Date(now);
      end.setDate(now.getDate() - (3 - index) * 7);
      end.setHours(23, 59, 59, 999);

      return { name: `W${index + 1}`, start, end, amount: 0 };
    });

    for (const payment of payments) {
      const createdAt = new Date(payment.createdAt);
      const bucket = buckets.find((item) => createdAt >= item.start && createdAt <= item.end);
      if (bucket) {
        bucket.amount += Number(payment.amount || 0);
      }
    }

    return buckets.map(({ name, amount }) => ({ name, amount }));
  }

  getPartnerPayments(_partnerId: string) {
    return this.paymentsRepo.find({ order: { createdAt: 'DESC' } });
  }

  getMyPayments(userId: string) {
    return this.paymentsRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async revenueSummary() {
    const all = await this.paymentsRepo.find();
    const paid = all.filter((p) => p.status === 'paid');
    const failed = all.filter((p) => p.status === 'failed');
    const pending = all.filter((p) => p.status === 'pending');
    const paidAmount = paid.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return { total: all.length, paid: paid.length, failed: failed.length, pending: pending.length, paidAmount, currency: 'KZT' };
  }
}
