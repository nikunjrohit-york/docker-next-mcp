import { SidebarNav } from '@/components/sidebar/sidebar-nav';

const sidebarItems = [
  {
    title: 'Chat',
    href: '/dashboard',
    icon: 'chat',
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: 'settings',
  },
];

export function Sidebar() {
  return (
    <div className="hidden border-r border-gray-700 bg-gray-900 md:block w-64 h-screen sticky top-0 overflow-y-auto">
      <div className="flex flex-col gap-2 p-4 h-full">
        <div className="flex h-14 items-center border-b border-gray-700 px-2 mb-4">
          <h1 className="text-xl font-bold text-blue-400">InsightOne</h1>
        </div>
        <SidebarNav items={sidebarItems} />
      </div>
    </div>
  );
}
