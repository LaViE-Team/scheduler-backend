import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';

@Module({
    imports: [
        UsersModule,
        PassportModule,
        JwtModule.register({
            secret: jwtConstants.SECRET,
            signOptions: { expiresIn: jwtConstants.EXPIRE },
        }),
    ],
    providers: [AuthService, GoogleStrategy, FacebookStrategy],
    exports: [AuthService],
    controllers: [AuthController],
})
export class AuthModule {}
