import Link from 'next/link';

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
          <Link
            href="/api/auth/signin"
            className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 font-medium transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-500 font-medium transition-all"
          >
            Continue as Guest
          </Link>
        </div>
      ) : (
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-500 font-medium transition-all"
        >
          Enter Dashboard
        </Link>
      )}
      <p className="text-gray-600 text-sm mt-4">
        {isOAuthConfigured ? 'OAuth configured' : 'Running in local mode (no auth required)'}
      </p>
    </div>
  );
}
