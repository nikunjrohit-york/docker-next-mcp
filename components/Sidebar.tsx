import Link from 'next/link';

export function Sidebar() {
    return (
        <div className="w-64 bg-gray-800 p-4 border-r border-gray-700 hidden md:block h-screen sticky top-0">
            <h1 className="text-xl font-bold mb-6 text-blue-400">InsightOne</h1>
            <nav className="space-y-2">
                <Link href="/dashboard" className="block py-2 px-4 text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors">
                    Chat
                </Link>
                <Link href="/dashboard/settings" className="block py-2 px-4 text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors">
                    Settings
                </Link>
            </nav>
        </div>
    );
}
