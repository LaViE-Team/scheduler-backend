import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UsersService } from '../users/users.service'

@Injectable()
export class ScheduleService {
    constructor(private prisma: PrismaService, private userService: UsersService) {}

    async saveSchedule(username: string, fileName: string) {
        return this.prisma.schedule.create({
            data: {
                schedule_file: fileName,
                user_schedules: {
                    create: [{ username: username }],
                },
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
    async shareSchedule(username: string, shareInfo: { share_with: string; schedule_id: number }) {
        const shareWith = shareInfo.share_with ? shareInfo.share_with : ''
        const scheduleId = shareInfo.schedule_id ? shareInfo.schedule_id : -1

        // Check if user has the schedule
        const hasSchedule = await this.prisma.user_schedule.findFirst({
            where: {
                username: username,
                schedule_id: scheduleId,
                shared: false,
            },
        })
        if (!hasSchedule)
            return {
                status: 'failed',
                msg: 'schedule not exist',
            }

        // Check if shareWith - scheduleId record exists
        const shareRelationExists = await this.prisma.user_schedule.findFirst({
            where: {
                schedule_id: scheduleId,
                username: shareWith,
            },
        })
        if (shareRelationExists)
            return {
                status: 'failed',
                msg: 'duplicate',
            }

        // Check if shareWith user exists
        const userShareWithExists = await this.userService.findUser(shareWith)
        if (!userShareWithExists)
            return {
                status: 'failed',
                msg: 'user not exist',
            }

        return this.prisma.user_schedule.create({
            data: {
                username: shareWith,
                schedule_id: scheduleId,
                shared: true,
                shared_by_username: username,
            },
        })
    }
}
