import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

// Check if OAuth is configured
const isOAuthConfigured = !!(process.env.GITHUB_ID && process.env.GITHUB_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: isOAuthConfigured ? [GitHub] : [],
  callbacks: {
    session({ session }) {
      if (!isOAuthConfigured) {
        // Create a default session for local use
        return {
          ...session,
          user: {
            id: 'local-user',
            name: 'Local User',
            email: 'local@insightone.dev',
          },
        };
      }
      return session;
    },
  },
});
