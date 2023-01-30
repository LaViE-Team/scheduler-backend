import { Module } from '@nestjs/common'
import { ScheduleService } from './schedule.service'
import { PrismaModule } from '../prisma/prisma.module'
import { UsersModule } from '../users/users.module'

@Module({
    imports: [PrismaModule, UsersModule],
    providers: [ScheduleService],
    exports: [ScheduleService],
})
export class ScheduleModule {}
