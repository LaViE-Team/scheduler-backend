import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'

export class LoginUserDto {
    @ApiProperty()
    @IsNotEmpty()
    username: string

    @ApiProperty()
    @IsNotEmpty()
    password: string
}

export class CreateUserDto {
    @ApiProperty()
    @IsNotEmpty()
    username: string

    @ApiProperty()
    @IsNotEmpty()
    password: string

    @ApiProperty()
    @IsNotEmpty()
    email: string

    @ApiProperty()
    @IsNotEmpty()
    service_pack: number
}

export class ChangePasswordDto {
    @ApiProperty()
    @IsNotEmpty()
    oldPassword: string

    @ApiProperty()
    @IsNotEmpty()
    newPassword: string
}
