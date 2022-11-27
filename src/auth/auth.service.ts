import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';

import { LoginUserDto } from '../users/user.dto';
import { jwtConstants } from './constants';

@Injectable()
export class AuthService {
    constructor(
        private userService: UsersService,
        private jwtService: JwtService,
    ) {}

    async login(loginUserDto: LoginUserDto) {
        const user = await this.userService.findUser(loginUserDto.username);
        if (!user) {
            throw new HttpException(
                'invalid_credentials',
                HttpStatus.UNAUTHORIZED,
            );
        }

        const passwordMatch = await compare(
            loginUserDto.password,
            user.password,
        );
        if (!passwordMatch) {
            throw new HttpException(
                'invalid_credentials',
                HttpStatus.UNAUTHORIZED,
            );
        }

        const payload = { user: user.username, userId: user.id };
        return {
            access_token: this.jwtService.sign(payload),
            expires_in: jwtConstants.EXPIRE,
        };
    }

    async register(userDto: CreateUserDto) {
        let status = {
            success: true,
            message: 'ACCOUNT_CREATE_SUCCESS',
        };
        try {
            userDto.password = await this._getHash(userDto.password);
            await this.userService.createUser(userDto);
        } catch (err) {
            status = {
                success: false,
                message: err,
            };
        }
        return status;
    }

    async _getHash(password: string) {
        return hash(password, 10);
    }
}
