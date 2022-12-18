import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { UsersService } from '../users/users.service'
import { JwtService } from '@nestjs/jwt'
import { hash, compare } from 'bcrypt'

import { ChangePasswordDto, CreateUserDto, LoginUserDto } from '../users/user.dto'
import { jwtConstants } from './constants'
import { OAuth2Client } from 'google-auth-library'

@Injectable()
export class AuthService {
    constructor(private userService: UsersService, private jwtService: JwtService) {}
    _authClient = new OAuth2Client({ clientId: process.env.GOOGLE_CLIENT_ID })

    async login(loginUserDto: LoginUserDto) {
        const user = await this.userService.findUser(loginUserDto.username)
        if (!user) {
            throw new HttpException('invalid_credentials', HttpStatus.UNAUTHORIZED)
        }

        const passwordMatch = await compare(loginUserDto.password, user.password)
        if (!passwordMatch) {
            throw new HttpException('invalid_credentials', HttpStatus.UNAUTHORIZED)
        }

        return this._generateJwt(user)
    }

    async loginGoogle(accessToken: string) {
        const tokenInfo = await this._authClient.getTokenInfo(accessToken)
        const userId = tokenInfo.user_id ? tokenInfo.user_id : tokenInfo.sub
        const email = tokenInfo.email

        let userExists = await this.userService.findUserByEmail(email)
        if (!userExists) {
            const userDto: CreateUserDto = {
                username: `user${userId}`,
                password: `pa${Math.random().toString(36).substring(2, 12)}ss`,
                email: email,
                service_pack: 0,
            }

            const status = await this.register(userDto)
            if (!status.success) {
                throw new HttpException('Some error occured', HttpStatus.INTERNAL_SERVER_ERROR)
            }

            userExists = await this.userService.findUserByEmail(email)
        }

        return this._generateJwt(userExists)
    }

    async loginFacebook(user) {
        if (!user) {
            throw new BadRequestException('Unauthenticated')
        }

        let userExists = await this.userService.findUserByEmail(user.email)

        if (!userExists) {
            const userDto: CreateUserDto = {
                username: `userfb${user.id}`,
                password: `pa${Math.random().toString(36).substring(2, 12)}ss`,
                email: user.email,
                service_pack: 0,
            }

            const status = await this.register(userDto)
            if (!status.success) {
                throw new HttpException('Some error occured', HttpStatus.INTERNAL_SERVER_ERROR)
            }

            userExists = await this.userService.findUserByEmail(user.email)
        }

        return this._generateJwt(userExists)
    }

    async register(userDto: CreateUserDto) {
        let status = {
            success: true,
            message: 'ACCOUNT_CREATE_SUCCESS',
        }
        try {
            userDto.password = await this._getHash(userDto.password)
            await this.userService.createUser(userDto)
        } catch (err) {
            status = {
                success: false,
                message: err,
            }
        }
        return status
    }

    async changePassword(username: string, changePwdDto: ChangePasswordDto) {
        const status = {
            success: true,
            message: 'PASSWORD_CHANGED_SUCCESS',
        }

        const user = await this.userService.findUser(username)
        const passwordMatch = await compare(changePwdDto.oldPassword, user.password)
        if (!passwordMatch) {
            throw new HttpException('invalid_credentials', HttpStatus.UNAUTHORIZED)
        }

        const newPassword = await this._getHash(changePwdDto.newPassword)
        try {
            await this.userService.changePassword(username, newPassword)
        } catch (e) {
            console.log(e)
            status.success = false
            status.message = 'UNKNOWN_ERROR'
        }

        return status
    }

    async _getHash(password: string) {
        return hash(password, 10)
    }

    _generateJwt(user) {
        const payload = { username: user.username, sub: user.id }
        return {
            access_token: this.jwtService.sign(payload),
            expires_in: jwtConstants.EXPIRE,
            user_info: {
                username: user.username,
                email: user.email,
                service_pack: user.service_pack,
            },
        }
    }
}
