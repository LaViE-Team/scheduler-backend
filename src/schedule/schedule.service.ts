import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from '../users/users.service'

@Injectable()
export class ScheduleService {
    constructor(private prisma: PrismaService, private userService: UsersService) {}

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
    async shareSchedule(username: string, shareInfo: { shareWith: string; scheduleId: number }) {
        // Check if user has the schedule
        const hasSchedule = await this.prisma.user_schedule.findFirst({
            where: {
                username: username,
                schedule_id: shareInfo.scheduleId,
                shared: false,
            },
        })
        if (!hasSchedule)
            return {
                status: 'failed',
                msg: 'schedule not exist',
            }

        // Check if shareWith - scheduleId record exists
        const shareRelationExists = await this.prisma.user_schedule.findUnique({
            where: {
                schedule_id_username: {
                    schedule_id: shareInfo.scheduleId,
                    username: shareInfo.shareWith,
                },
            },
        })
        if (shareRelationExists)
            return {
                status: 'failed',
                msg: 'duplicate',
            }

        // Check if shareWith user exists
        const userShareWithExists = await this.userService.findUser(shareInfo.shareWith)
        if (!userShareWithExists)
            return {
                status: 'failed',
                msg: 'user not exist',
            }

        return this.prisma.user_schedule.create({
            data: {
                username: shareInfo.shareWith,
                schedule_id: shareInfo.scheduleId,
                shared: true,
                shared_by_username: username,
            },
        })
    }
}
