import { Module } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthModule } from '../auth/auth.module';
import { LabsController } from './labs.controller';
import { LabsService } from './labs.service';

@Module({
  imports: [AuthModule],
  controllers: [LabsController],
  providers: [LabsService, AuthGuard],
  exports: [LabsService]
})
export class LabsModule {}
