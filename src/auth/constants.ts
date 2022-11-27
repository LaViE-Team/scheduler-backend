export const jwtConstants = {
    SECRET: process.env.JWT_SECRET || 'secretKey',
    EXPIRE: process.env.JWT_EXPIRE || '3600s',
};
