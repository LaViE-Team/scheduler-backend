import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto, LoginUserDto } from '../users/user.dto';
import { LoginGoogleDto } from './login.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('/login')
    @ApiTags('Authentication')
    async login(@Body() loginDTO: LoginUserDto) {
        return this.authService.login(loginDTO);
    }

    @Post('/register')
    @ApiTags('Authentication')
    async register(@Body() createUserDto: CreateUserDto) {
        return this.authService.register(createUserDto);
    }

    @Post('/google')
    @ApiTags('Authentication')
    async authGoogle(@Body() loginGoogleDto: LoginGoogleDto) {
        return await this.authService.loginGoogle(loginGoogleDto.access_token);
    }
}
