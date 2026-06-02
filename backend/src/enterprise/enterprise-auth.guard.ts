import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { EnterpriseService } from './enterprise.service';

@Injectable()
export class EnterpriseAuthGuard implements CanActivate {
  constructor(private readonly enterpriseService: EnterpriseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    request.enterpriseUser = await this.enterpriseService.resolveSession(request.headers.cookie);
    return true;
  }
}
