// apps/merchant-app/lib/auth.ts
import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import prisma from '@repo/db/client'; // Default import for Prisma client

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account }: { user: { email?: string | null; name?: string | null }; account: { provider: string } | null }) {
      console.log('Sign-in callback triggered', { user, account });

      if (!account || account.provider !== 'google') {
        console.error('Unsupported provider or account missing');
        return false;
      }

      if (!user.email) {
        console.error('User email is missing');
        return false;
      }

      try {
        await prisma.merchant.upsert({
          select: { id: true },
          where: { email: user.email },
          create: {
            email: user.email,
            name: user.name || '', // Handle null name
            auth_type: 'Google', // Match schema.prisma (string or enum)
          },
          update: {
            name: user.name || '', // Handle null name
            auth_type: 'Google', // Match schema.prisma (string or enum)
          },
        });
        return true;
      } catch (error) {
        console.error('Error saving merchant to database:', error);
        return false;
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'secret',
};