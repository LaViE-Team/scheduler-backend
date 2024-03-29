import {
    CACHE_MANAGER,
    Controller,
    Get,
    Inject,
    Post,
    Req,
    Res,
    StreamableFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common'
import { Cache } from 'cache-manager'
import { JwtAuthGuard } from '../auth/guards/jwt.guard'
import { ApiTags } from '@nestjs/swagger'
import { TimetableService } from './timetable.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'
import { createReadStream } from 'fs'
import { join } from 'path'
import { ScheduleService } from '../schedule/schedule.service'

@Controller('timetable')
export class TimetableController {
    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private timetableService: TimetableService,
        private scheduleService: ScheduleService,
    ) {}

    @Post('generate-timetable')
    @UseGuards(JwtAuthGuard)
    @ApiTags('Timetable')
    async generateTimetable(@Req() req) {
        const user = req.user
        const desiredSubjects = req.body
        const result = { highDensity: [], lowDensity: [] }
        if (!desiredSubjects) return result

        const { highDensity, lowDensity } = await this.timetableService.generateTimetable(
            user.username,
            desiredSubjects,
        )

        const classList: any[] = await this.cacheManager.get(`class_list_${user.username}`)

        // Get 10 timetable of each type
        for (let i = 0; i < 10; i++) {
            if (highDensity.length) {
                const highDensityTimetable = Array.from(new Set(highDensity.shift()))
                result.highDensity.push(
                    highDensityTimetable.map((element) => classList.find((item) => item.classCode == element)),
                )
            }

            if (lowDensity.length) {
                const lowDensityTimetable = Array.from(new Set(lowDensity.shift()))
                result.lowDensity.push(
                    lowDensityTimetable.map((element) => classList.find((item) => item.classCode == element)),
                )
            }
        }

        return result
    }

    @Post('export-timetable')
    @UseGuards(JwtAuthGuard)
    @ApiTags('Timetable')
    @UseInterceptors(FileInterceptor('file'))
    async exportTimetable(@Req() req, @Res({ passthrough: true }) res: Response) {
        const user = req.user
        const timetableClasses: string[] = req.body
        if (!timetableClasses) return []

        const classList: any[] = await this.cacheManager.get(`class_list_${user.username}`)
        const extractedClasses = timetableClasses.map((element) => classList.find((item) => item.classCode == element))

        if (extractedClasses.includes(undefined))
            return {
                status: 'failed',
                msg: 'class not exist in chosen subjects list',
            }

        const fileName = await this.timetableService.saveTimetable(user.username, extractedClasses)
        await this.scheduleService.saveSchedule(user.username, fileName.split('/')[1])

        // Update cache
        const savedSchedules = await this.scheduleService.getSavedSchedules(user.username)
        await this.cacheManager.set(`saved_schedules_${user.username}`, savedSchedules, 86400)

        const file = createReadStream(join(process.cwd(), fileName))
        res.set({
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="schedule.csv"',
        })
        return new StreamableFile(file)
    }

    @Get('get-exported-timetables')
    @UseGuards(JwtAuthGuard)
    @ApiTags('Timetable')
    async getExportedTimetables(@Req() req) {
        const user = req.user
        let savedSchedules = await this.cacheManager.get(`saved_schedules_${user.username}`)

        if (savedSchedules) {
            savedSchedules = await this.scheduleService.getSavedSchedules(user.username)
            await this.cacheManager.set(`saved_schedules_${user.username}`, savedSchedules, 86400)
        }

        return savedSchedules
    }

    @Get('download-timetable')
    @UseGuards(JwtAuthGuard)
    @ApiTags('Timetable')
    @UseInterceptors(FileInterceptor('file'))
    async downloadTimetable(@Req() req, @Res({ passthrough: true }) res: Response) {
        const user = req.user
        const fileId = req.query['file_id']
        let savedSchedules: any[] = await this.cacheManager.get(`saved_schedules_${user.username}`)

        if (!savedSchedules) {
            savedSchedules = await this.scheduleService.getSavedSchedules(user.username)
            await this.cacheManager.set(`saved_schedules_${user.username}`, savedSchedules, 86400)
        }

        const fileInfo = savedSchedules.find((element) => element.id == fileId)
        if (!fileInfo)
            return {
                status: 'failed',
                msg: 'schedule not found',
            }

        const fileName = `generated_files/${fileInfo.schedule_file}`
        const file = createReadStream(join(process.cwd(), fileName))
        res.set({
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="schedule.csv"',
        })
        await this.scheduleService.updateExportDate(fileInfo.schedule_file)
        return new StreamableFile(file)
    }

    @Post('share-timetable')
    @UseGuards(JwtAuthGuard)
    @ApiTags('Timetable')
    async shareTimetable(@Req() req) {
        const user = req.user
        const shareWith: string = req.body.share_with
        const timetableClasses: string[] = req.body.timetable_classes
        if (!timetableClasses)
            return {
                status: 'failed',
                msg: 'invalid body',
            }

        const classList: any[] = await this.cacheManager.get(`class_list_${user.username}`)
        if (classList == null || classList == undefined || classList.length == 0)
            return {
                status: 'failed',
                msg: 'please re-upload the csv/xls file',
            }
        const extractedClasses = timetableClasses.map((element) => classList.find((item) => item.classCode == element))

        if (extractedClasses.includes(undefined))
            return {
                status: 'failed',
                msg: 'class not exist in chosen subjects list',
            }

        const fileName = await this.timetableService.saveTimetable(user.username, extractedClasses, true)
        const savedSchedule = await this.scheduleService.saveSchedule(user.username, fileName.split('/')[1])

        return await this.scheduleService.shareSchedule(user.username, {
            share_with: shareWith,
            schedule_id: savedSchedule.id,
        })
    }

    @Get('get-shared-timetables')
    @UseGuards(JwtAuthGuard)
    @ApiTags('Timetable')
    async getSharedTimetables(@Req() req) {
        const user = req.user
        return await this.scheduleService.getSharedSchedules(user.username)
    }
}
