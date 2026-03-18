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
    const linkedCase = await this.casesService.findById(caseId);
    const payment = await this.paymentsRepo.save(
      this.paymentsRepo.create({
        userId,
        amount,
        caseId,
        clinicId: linkedCase?.clinicId || null,
        status: 'pending',
        providerId: null,
        providerPaymentId: null
      })
    );

    await this.casesService.setPaymentPending(caseId);

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

    // idempotency / duplicate protection
    if (payment.status === 'paid') {
      return { received: true, message: 'already processed' };
    }

    payment.status = payload.status;
    payment.providerId = payload.transactionId || payment.providerId;
    payment.providerPaymentId = payload.transactionId || payment.providerPaymentId;
    await this.paymentsRepo.save(payment);

    if (payload.status === 'paid') {
      await this.casesService.activateCase(payment.caseId);
      await this.tryCreateEarning(payment.caseId, payment.id, Number(payment.amount || 0));
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

  async getDoctorEarnings(doctorId: string) {
    const rows = await this.paymentsRepo.query(
      'select coalesce(sum(doctor_share),0) as total, count(*)::int as count from doctor_earnings where doctor_id = $1',
      [doctorId]
    );
    const total = Number(rows?.[0]?.total || 0);
    const count = Number(rows?.[0]?.count || 0);
    return { totalPaid: total, currency: 'KZT', count };
  }

  async getPartnerPayments(partnerId: string) {
    const clinicRows = await this.paymentsRepo.query('select id from clinics where partner_user_id = $1 limit 1', [partnerId]);
    const clinicId = clinicRows?.[0]?.id;
    if (!clinicId) return [];
    return this.paymentsRepo.find({ where: { clinicId }, order: { createdAt: 'DESC' } });
  }

  async getPartnerClinicCommissionSummary(partnerId: string) {
    const clinicRows = await this.paymentsRepo.query('select id from clinics where partner_user_id = $1 limit 1', [partnerId]);
    const clinicId = clinicRows?.[0]?.id;
    if (!clinicId) return { clinicId: null, totalCommission: 0, totalCases: 0, recent: [] };

    const totalRows = await this.paymentsRepo.query(
      'select coalesce(sum(amount),0) as total, count(*)::int as count from clinic_commission where clinic_id = $1',
      [clinicId]
    );

    const recent = await this.paymentsRepo.query(
      'select * from clinic_commission where clinic_id = $1 order by created_at desc limit 50',
      [clinicId]
    );

    return {
      clinicId,
      totalCommission: Number(totalRows?.[0]?.total || 0),
      totalCases: Number(totalRows?.[0]?.count || 0),
      recent
    };
  }


  async getPartnerPayoutBacklog(partnerId: string) {
    const clinicRows = await this.paymentsRepo.query('select id from clinics where partner_user_id = $1 limit 1', [partnerId]);
    const clinicId = clinicRows?.[0]?.id;
    if (!clinicId) {
      return {
        clinicId: null,
        totals: { holdAmount: 0, holdCount: 0, readyAmount: 0, readyCount: 0 },
        doctorBreakdown: []
      };
    }

    const totalsRows = await this.paymentsRepo.query(
      `select
         coalesce(sum(case when de.status = 'hold' then de.doctor_share else 0 end),0) as hold_amount,
         coalesce(sum(case when de.status = 'ready_for_payout' then de.doctor_share else 0 end),0) as ready_amount,
         count(*) filter (where de.status = 'hold')::int as hold_count,
         count(*) filter (where de.status = 'ready_for_payout')::int as ready_count
       from doctor_earnings de
       join cases c on c.id = de.case_id
       where c.clinic_id = $1`,
      [clinicId]
    );

    const doctorBreakdown = await this.paymentsRepo.query(
      `select
         d.id as doctor_id,
         d.full_name as doctor_name,
         coalesce(sum(case when de.status = 'hold' then de.doctor_share else 0 end),0) as hold_amount,
         coalesce(sum(case when de.status = 'ready_for_payout' then de.doctor_share else 0 end),0) as ready_amount,
         count(*) filter (where de.status = 'hold')::int as hold_count,
         count(*) filter (where de.status = 'ready_for_payout')::int as ready_count
       from doctor_earnings de
       join cases c on c.id = de.case_id
       join doctors d on d.id = de.doctor_id
       where c.clinic_id = $1
       group by d.id, d.full_name
       order by ready_amount desc, hold_amount desc`,
      [clinicId]
    );

    const t = totalsRows?.[0] || {};
    return {
      clinicId,
      totals: {
        holdAmount: Number(t.hold_amount || 0),
        holdCount: Number(t.hold_count || 0),
        readyAmount: Number(t.ready_amount || 0),
        readyCount: Number(t.ready_count || 0)
      },
      doctorBreakdown
    };
  }

  getMyPayments(userId: string) {
    return this.paymentsRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  private async tryCreateEarning(caseId: string, paymentId: string, grossAmount: number) {
    const linkedCase = await this.casesService.findById(caseId);
    if (!linkedCase) return;

    // earning only when payment is paid and consultation already finished/closed
    if (!['consultation_finished', 'closed'].includes(linkedCase.status)) {
      await this.auditService.log('earning.waiting_for_consultation', linkedCase.patientId, { caseId, paymentId, status: linkedCase.status });
      return;
    }

    // create earning once per case
    const existing = await this.paymentsRepo.query('select id from doctor_earnings where case_id = $1 limit 1', [caseId]);
    if (existing?.length) {
      return;
    }

    const doctorId = linkedCase.doctorId;
    if (!doctorId) return;

    const clinicId = linkedCase.clinicId || null;
    const platformShare = Math.round(grossAmount * 0.2);
    const clinicShare = Math.round(grossAmount * 0.1);
    const doctorShare = Math.max(0, grossAmount - platformShare - clinicShare);

    const holdUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.paymentsRepo.query(
      `insert into doctor_earnings
        (doctor_id, case_id, gross_amount, doctor_share, clinic_share, platform_share, hold_until, status, payment_id)
       values ($1,$2,$3,$4,$5,$6,$7,'hold',$8)`,
      [doctorId, caseId, grossAmount, doctorShare, clinicShare, platformShare, holdUntil.toISOString(), paymentId]
    );

    await this.paymentsRepo.query(
      'insert into platform_commission (case_id, payment_id, amount) values ($1, $2, $3)',
      [caseId, paymentId, platformShare]
    );

    await this.paymentsRepo.query(
      'insert into clinic_commission (clinic_id, case_id, amount) values ($1, $2, $3)',
      [clinicId, caseId, clinicShare]
    );

    await this.auditService.log('earning.created', doctorId, {
      caseId,
      grossAmount,
      doctorShare,
      clinicShare,
      platformShare,
      holdUntil: holdUntil.toISOString(),
      status: 'hold'
    });
  }


  async reconcileCaseEarnings(caseId: string) {
    const payment = await this.paymentsRepo.findOne({ where: { caseId, status: 'paid' }, order: { createdAt: 'DESC' } as any });
    if (!payment) return { reconciled: false, reason: 'no_paid_payment' };
    await this.tryCreateEarning(caseId, payment.id, Number(payment.amount || 0));
    return { reconciled: true };
  }


  async markReadyForPayouts() {
    const updated = await this.paymentsRepo.query(
      "update doctor_earnings set status='ready_for_payout' where status='hold' and hold_until <= now() returning id"
    );
    return { moved: updated.length };
  }

  async dryRunManualPayout(doctorId: string, periodStart: string, periodEnd: string) {
    const rows = await this.paymentsRepo.query(
      `select coalesce(sum(doctor_share),0) as total, count(*)::int as entries from doctor_earnings
       where doctor_id = $1 and status = 'ready_for_payout' and created_at::date between $2::date and $3::date`,
      [doctorId, periodStart, periodEnd]
    );
    const amount = Number(rows?.[0]?.total || 0);
    const entries = Number(rows?.[0]?.entries || 0);

    return {
      doctorId,
      periodStart,
      periodEnd,
      amount,
      entries,
      canCreate: amount > 0
    };
  }

  async createManualPayout(doctorId: string, periodStart: string, periodEnd: string, actorId: string) {
    const rows = await this.paymentsRepo.query(
      `select coalesce(sum(doctor_share),0) as total from doctor_earnings
       where doctor_id = $1 and status = 'ready_for_payout' and created_at::date between $2::date and $3::date`,
      [doctorId, periodStart, periodEnd]
    );
    const amount = Number(rows?.[0]?.total || 0);
    if (amount <= 0) return { created: false, reason: 'no_ready_earnings' };

    await this.paymentsRepo.query(
      `insert into payouts (doctor_id, period_start, period_end, amount, status, paid_at)
       values ($1,$2,$3,$4,'paid_out', now())`,
      [doctorId, periodStart, periodEnd, amount]
    );

    await this.paymentsRepo.query(
      `update doctor_earnings set status='paid_out'
       where doctor_id = $1 and status='ready_for_payout' and created_at::date between $2::date and $3::date`,
      [doctorId, periodStart, periodEnd]
    );

    await this.auditService.log('payout.created', actorId, { doctorId, periodStart, periodEnd, amount });
    return { created: true, amount };
  }

  async reversePayout(payoutId: string, actorId: string) {
    const rows = await this.paymentsRepo.query('select * from payouts where id = $1 limit 1', [payoutId]);
    const payout = rows?.[0];
    if (!payout) return { reversed: false, reason: 'not_found' };

    await this.paymentsRepo.query("update payouts set status='reversed' where id = $1", [payoutId]);
    await this.paymentsRepo.query(
      `update doctor_earnings set status='reversed'
       where doctor_id = $1 and created_at::date between $2::date and $3::date and status='paid_out'`,
      [payout.doctor_id, payout.period_start, payout.period_end]
    );

    await this.auditService.log('payout.reversed', actorId, { payoutId });
    return { reversed: true };
  }

  async listPayouts() {
    return this.paymentsRepo.query('select * from payouts order by created_at desc limit 500');
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
