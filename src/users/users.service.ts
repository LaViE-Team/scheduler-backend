import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateUserDto } from './user.dto'

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    async findUser(username: string) {
        return this.prisma.user.findUnique({ where: { username: username } })
    }

    async createUser(userDto: CreateUserDto) {
        const userInDb = await this.findUser(userDto.username)
        if (userInDb) {
            throw new HttpException('user_already_exist', HttpStatus.CONFLICT)
        }

        return await this.prisma.user.create({
            data: { ...userDto },
        })
    }

    async findUserByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email: email } })
    }
}
