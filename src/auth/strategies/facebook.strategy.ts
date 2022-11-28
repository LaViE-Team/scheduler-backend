import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
    constructor() {
        super({
            clientID: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_SECRET,
            callbackURL: process.env.FACEBOOK_REDIRECT,
            scope: 'email',
            profileFields: ['id', 'emails', 'name'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (err: any, user: any, info?: any) => void,
    ): Promise<any> {
        const { id, name, emails } = profile;
        const user = {
            id: id,
            email: emails[0].value,
            name: `${name.givenName}${name.familyName}`,
        };
        const payload = {
            user,
            accessToken,
        };

        done(null, payload);
    }
}
