import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ScheduleService {
    constructor(private prisma: PrismaService) {}

    async saveSchedule(username: string, fileName: string) {
        return this.prisma.schedule.create({
            data: {
                username: username,
                schedule_file: fileName,
            },
        })
    }

    async updateExportDate(fileName: string) {
        return this.prisma.schedule.update({
            where: { schedule_file: fileName },
            data: { export_date: new Date() },
        })
    }

    async getSavedSchedules(username: string) {
        return this.prisma.user_schedule
            .findMany({
                where: {
                    username: username,
                    shared: false,
                },
                include: {
                    schedule: true,
                },
            })
            .then((userSchedules) => userSchedules.map((userSchedule) => ({ ...userSchedule.schedule })))
    }
}
