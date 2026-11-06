import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Language',
        href: '/language',
    },
];

export default function Language() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Language"></Head>

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-semibold">Language</h1>
                        <p className="text-muted-foreground text-sm">Your saved languages</p>
                    </div>
                    <button className="text-2xl inline-flex w-fit max-sm:py-1.5 max-sm:px-2 max-sm:text-xs items-center gap-2 rounded-md bg-black px-4 py-2 me-2 text-sm text-white transition-colors hover:bg-gray-900">
                        Add Language
                    </button>
                </div>

                <div className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[100vh] flex-1 rounded-xl border md:min-h-min">
                    {/* <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" /> */}
                </div>
            </div>
        </AppLayout>
    );
}
