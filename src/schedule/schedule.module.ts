import { Module } from '@nestjs/common'
import { ScheduleService } from './schedule.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
    imports: [PrismaModule],
    providers: [ScheduleService],
    exports: [ScheduleService],
})
export class ScheduleModule {}
