import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Book, Upload } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dictionary',
        href: '/dictionary',
    },
];

const dictionaryCards = [
    {
        title: 'Head Words',
        description: '',
        icon: Book,
    },
    {
        title: 'Dictionary Words',
        description: '',
        icon: Book,
    },
    {
        title: 'Pages',
        description: '',
        icon: Book,
    },
];

export default function Dictionary() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dictionary"></Head>

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex-col flex justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-semibold">Dictionary</h1>
                        <p className="text-muted-foreground text-sm">Import your local languages dictionary</p>
                    </div>
                    <button className="inline-flex w-fit max-sm:py-1.5 max-sm:px-2 max-sm:text-xs items-center gap-2 rounded-md bg-black px-4 py-2 me-2 text-sm text-white transition-colors hover:bg-gray-900">
                        <Upload className="size-4" />
                        Import
                    </button>
                </div>

                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {dictionaryCards.map((card) => {
                        const cardContent = (
                            <>
                                <card.icon className="text-muted-foreground size-5" />
                                <p className="mt-4 font-medium">{card.title}</p>
                                <p className="text-muted-foreground mt-1 text-sm">{card.description}</p>
                            </>
                        );

                        return (
                            <div key={card.title} className="border-sidebar-border/70 dark:border-sidebar-border rounded-xl border p-6">
                                {cardContent}
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
