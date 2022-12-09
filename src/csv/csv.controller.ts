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

        const result = [];
        for (const line of lines) {
            const lineArr = line.split(',');
            result.push({
                subjectCode: lineArr[0],
                classId: lineArr[1],
                subjectName: lineArr[2],
                day: lineArr[3],
                startTime: lineArr[4],
                endTime: lineArr[5],
            });
        }
        return result;
    }
}
