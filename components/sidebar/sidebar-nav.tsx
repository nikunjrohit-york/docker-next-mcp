"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MessageSquare, Settings, LucideIcon } from "lucide-react";

const IconMap: Record<string, LucideIcon> = {
    chat: MessageSquare,
    settings: Settings,
};

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
    items: {
        href: string;
        title: string;
        icon: keyof typeof IconMap;
    }[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
    const pathname = usePathname();

    return (
        <nav
            className={cn(
                "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
                className
            )}
            {...props}
        >
            {items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = IconMap[item.icon];

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-700 hover:text-white transition-colors",
                            isActive
                                ? "bg-gray-800 text-white"
                                : "text-gray-300 bg-transparent"
                        )}
                    >
                        {Icon && <Icon className="mr-2 h-4 w-4" />}
                        {item.title}
                    </Link>
                );
            })}
        </nav>
    );
}

