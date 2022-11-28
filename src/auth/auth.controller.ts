import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto, LoginUserDto } from '../users/user.dto';
import { GoogleOauthGuard } from './guards/google-oauth.guard';
import { FacebookAuthGuard } from './guards/facebook-auth.guard';

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

    @Get('/google')
    @ApiTags('Authentication')
    @UseGuards(GoogleOauthGuard)
    async authGoogle(@Req() req) {}

    @Get('/google/redirect')
    @ApiTags('Authentication')
    @UseGuards(GoogleOauthGuard)
    async redirectGoogleAuth(@Req() req) {
        return this.authService.loginGoogle(req.user);
    }

    @Get('/facebook')
    @ApiTags('Authentication')
    @UseGuards(FacebookAuthGuard)
    async authFacebook(@Req() req) {}

    @Get('/facebook/redirect')
    @ApiTags('Authentication')
    @UseGuards(FacebookAuthGuard)
    async redirectFacebookAuth(@Req() req) {
        return this.authService.loginFacebook(req.user.user);
    }
}
