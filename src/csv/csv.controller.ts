import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { CsvService } from './csv.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('csv')
export class CsvController {
    constructor(private csvService: CsvService) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        const lines = file.buffer.toString().split('\r\n');
        lines.shift();

        const result = [];
        for (const line of lines) {
            const lineArr = line.split(',');
            result.push({
                moduleId: lineArr[0],
                classId: lineArr[1],
                name: lineArr[2],
                date: lineArr[3],
                time: lineArr[4],
            });
        }
        return result;
    }
}
