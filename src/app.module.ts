import { Module, CacheModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { CsvModule } from './csv/csv.module';
import { redisStore } from 'cache-manager-redis-store';
import { TimetableService } from './timetable/timetable.service';
import { TimetableController } from './timetable/timetable.controller';

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        UsersModule,
        ConfigModule.forRoot({ isGlobal: true }),
        CsvModule,
        CacheModule.registerAsync(<any>{
            isGlobal: true,
            useFactory: async () => {
                const store = await redisStore({
                    socket: {
                        host: process.env.REDIS_HOST,
                        port: Number(process.env.REDIS_PORT),
                    },
                    ttl: 86400 * 3,
                });

                return {
                    store: {
                        create: () => store,
                    },
                };
            },
        }),
    ],
    controllers: [AppController, TimetableController],
    providers: [AppService, TimetableService],
})
export class AppModule {}
