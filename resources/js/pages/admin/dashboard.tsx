import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, FolderKanban, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
    },
];

const adminCards = [
    {
        title: 'Users',
        description: 'Manage registered accounts and roles.',
        icon: Users,
    },
    {
        title: 'Dictionaries',
        description: 'Review and maintain dictionary content.',
        icon: BookOpen,
        href: '/dictionary',
    },
    {
        title: 'Import Dictionary',
        description: 'Import words and entries into the dictionary.',
        icon: FolderKanban,
        href: '/import_dictionary',
    },
];

export default function AdminDashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
                    <p className="text-muted-foreground text-sm">
                        Overview and management tools for administrators.
                    </p>
                </div>

                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {adminCards.map((card) => {
                        const content = (
                            <>
                                <card.icon className="text-muted-foreground size-5" />
                                <p className="mt-4 font-medium">{card.title}</p>
                                <p className="text-muted-foreground mt-1 text-sm">{card.description}</p>
                            </>
                        );

                        const className =
                            'border-sidebar-border/70 dark:border-sidebar-border rounded-xl border p-6';

                        return card.href ? (
                            <Link
                                key={card.title}
                                href={card.href}
                                className={`${className} hover:border-sidebar-border hover:bg-sidebar-accent/50 transition-colors`}
                            >
                                {content}
                            </Link>
                        ) : (
                            <div key={card.title} className={className}>
                                {content}
                            </div>
                        );
                    })}
                </div>

                <div className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[100vh] flex-1 rounded-xl border md:min-h-min">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </AppLayout>
    );
}
