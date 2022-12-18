import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'

export class DownloadTimetableDto {
    @ApiProperty()
    @IsNotEmpty()
    file_id: string
}
