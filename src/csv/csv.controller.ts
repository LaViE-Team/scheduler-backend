import {
    Controller,
    Get,
    Post,
    Res,
    StreamableFile,
    UploadedFile,
    UseInterceptors,
    CACHE_MANAGER,
    Inject,
    UseGuards,
    Req,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CsvService } from './csv.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { createReadStream } from 'fs';
import { join } from 'path';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('csv')
export class CsvController {
    constructor(
        private csvService: CsvService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    @Post('upload')
    @ApiTags('CSV')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req) {
        const lines = file.buffer.toString().split('\r\n');
        lines.shift();

        const subjects = {};
        for (const line of lines) {
            const lineArr = line.split(',');
            const subjectCode = lineArr[0];
            const classId = lineArr[1];
            const subjectName = lineArr[2];
            const day = lineArr[3];
            const startTime = lineArr[4];
            const endTime = lineArr[5];

            if (!(subjectCode in subjects)) {
                subjects[subjectCode] = {
                    subjectName: subjectName,
                    classes: {},
                };
                subjects[subjectCode]['classes'][classId] = [
                    {
                        day: day,
                        start: startTime,
                        end: endTime,
                    },
                ];
            } else if (!(classId in subjects[subjectCode]['classes'])) {
                subjects[subjectCode]['classes'][classId] = [
                    {
                        day: day,
                        start: startTime,
                        end: endTime,
                    },
                ];
            } else {
                subjects[subjectCode]['classes'][classId].push({
                    day: day,
                    start: startTime,
                    end: endTime,
                });
            }
        }

        const result = [];
        for (const [key, value] of Object.entries(subjects)) {
            result.push({
                subjectCode: key,
                ...(value as object),
            });
        }
        await this.cacheManager.set(`csv_${req.user.username}`, result);
        return result;
    }

    @Get('download-sample')
    @ApiTags('CSV')
    @UseInterceptors(FileInterceptor('file'))
    downloadSampleCSV(
        @Res({ passthrough: true }) res: Response,
    ): StreamableFile {
        const file = createReadStream(join(process.cwd(), 'sample.csv'));
        res.set({
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="sample.csv"',
        });
        return new StreamableFile(file);
    }

    @Get('get-cached-csv')
    @UseGuards(JwtAuthGuard)
    @ApiTags('CSV')
    async getCacheData(@Req() req) {
        return await this.cacheManager.get(`csv_${req.user.username}`);
    }

    @Post('update-cached-csv')
    @UseGuards(JwtAuthGuard)
    @ApiTags('CSV')
    async updateCacheData(@Req() req) {
        const user = req.user;
        const body = req.body;
        try {
            await this.cacheManager.set(`csv_${user.username}`, body);
            return { status: 'successful' };
        } catch (e) {
            console.log(e);
            return { status: 'failed' };
        }
    }
}
