import { prismaAdapter } from '@better-auth/prisma-adapter';
import { betterAuth } from 'better-auth';
import { emailOTP } from 'better-auth/plugins';
import { database } from '../../database.js';
import { sendVerificationCode } from './mail.js';

const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) throw new Error('BETTER_AUTH_SECRET is required');

export const auth = betterAuth({
  secret,
  baseURL,
  trustedOrigins: [...new Set([baseURL, 'http://localhost:3000', 'http://127.0.0.1:3000'])],
  database: prismaAdapter(database(), { provider: 'postgresql' }),
  emailAndPassword: { enabled: true, requireEmailVerification: true, minPasswordLength: 8 },
  emailVerification: { autoSignInAfterVerification: true },
  plugins: [
    emailOTP({
      otpLength: 5,
      expiresIn: 300,
      sendVerificationOnSignUp: true,
      storeOTP: 'hashed',
      async sendVerificationOTP({ email, otp }) {
        await sendVerificationCode(email, otp);
      },
    }),
  ],
});
