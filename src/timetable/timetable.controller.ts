import {
    CACHE_MANAGER,
    Controller,
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

@Controller('timetable')
export class TimetableController {
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache, private timetableService: TimetableService) {}

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
        const file = createReadStream(join(process.cwd(), fileName))
        res.set({
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="schedule.csv"',
        })
        return new StreamableFile(file)
    }
}
