import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  // Check if OAuth is configured
  const isOAuthConfigured = !!(process.env.GITHUB_ID && process.env.GITHUB_SECRET);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 text-transparent bg-clip-text">
        InsightOne
      </h1>
      <p className="text-gray-400 mb-8">Your Local AI Project Intelligence Dashboard</p>
      {isOAuthConfigured ? (
        <div className="flex gap-4">
          <Link href="/api/auth/signin">
            <Button variant="secondary" size="lg">Sign In</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="primary" size="lg">Continue as Guest</Button>
          </Link>
        </div>
      ) : (
        <Link href="/dashboard">
          <Button variant="primary" size="lg">Enter Dashboard</Button>
        </Link>
      )}
      <p className="text-gray-600 text-sm mt-4">
        {isOAuthConfigured ? 'OAuth configured' : 'Running in local mode (no auth required)'}
      </p>
    </div>
  );
}
