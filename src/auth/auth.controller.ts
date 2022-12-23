import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { ApiTags } from '@nestjs/swagger'
import { ChangePasswordDto, CreateUserDto, LoginUserDto } from '../users/user.dto'
import { LoginGoogleDto } from './login.dto'
import { JwtAuthGuard } from './guards/jwt.guard'

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('/login')
    @ApiTags('Authentication')
    async login(@Body() loginDTO: LoginUserDto) {
        return this.authService.login(loginDTO)
    }

    @Post('/register')
    @ApiTags('Authentication')
    async register(@Body() createUserDto: CreateUserDto) {
        return this.authService.register(createUserDto)
    }

    @Post('/google')
    @ApiTags('Authentication')
    async authGoogle(@Body() loginGoogleDto: LoginGoogleDto) {
        return await this.authService.loginGoogle(loginGoogleDto.access_token)
    }

    @Post('change-password')
    @UseGuards(JwtAuthGuard)
    @ApiTags('Authentication')
    async changePassword(@Req() req) {
        const changePwdDto: ChangePasswordDto = req.body
        const user = req.user
        return await this.authService.changePassword(user.username, changePwdDto)
    }
}
