import { Controller, Get, StreamableFile, Res } from '@nestjs/common';
import { createReadStream, createWriteStream } from 'fs';
import { join } from 'path';
import type { Response } from 'express';

@Controller('download')
export class DownloadController {
    @Get('sample_csv')
    getFile(@Res({ passthrough: true }) res: Response): StreamableFile {
        const file = createReadStream(join('sample_data.csv'));
        res.set({
            'Content-Type': 'application/csv',
            'Content-Disposition': 'attachment; filename="sample.csv"',
        });
        return new StreamableFile(file);
    }
}
