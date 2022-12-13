import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { CsvService } from './csv.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';

@Controller('csv')
export class CsvController {
    constructor(private csvService: CsvService) {}

    @Post('upload')
    @ApiTags('CSV')
    @UseInterceptors(FileInterceptor('file'))
    uploadFile(@UploadedFile() file: Express.Multer.File) {
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
        return result;
    }
}
