import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    async findUser(username: string) {
        return this.prisma.user.findUnique({ where: { username: username } });
    }
}
