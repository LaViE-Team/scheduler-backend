import { Module, CacheModule } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { ConfigModule } from '@nestjs/config'
import { CsvModule } from './csv/csv.module'
import { redisStore } from 'cache-manager-redis-store'
import { TimetableModule } from './timetable/timetable.module'
import { ScheduleModule } from './schedule/schedule.module'

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        UsersModule,
        TimetableModule,
        CsvModule,
        ConfigModule.forRoot({ isGlobal: true }),
        CacheModule.registerAsync(<any>{
            isGlobal: true,
            useFactory: async () => {
                const store = await redisStore({
                    socket: {
                        host: process.env.REDIS_HOST,
                        port: Number(process.env.REDIS_PORT),
                    },
                    ttl: 86400 * 3,
                })

                return {
                    store: {
                        create: () => store,
                    },
                }
            },
        }),
        ScheduleModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
