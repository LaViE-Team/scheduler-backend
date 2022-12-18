import { Module } from '@nestjs/common'
import { TimetableController } from './timetable.controller'
import { TimetableService } from './timetable.service'
import { ScheduleModule } from '../schedule/schedule.module'

@Module({
    imports: [ScheduleModule],
    controllers: [TimetableController],
    providers: [TimetableService],
})
export class TimetableModule {}
