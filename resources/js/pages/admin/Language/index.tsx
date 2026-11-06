import { Head, usePage } from '@inertiajs/react';
import { BookOpen, Plus, Trash, Pencil } from 'lucide-react';
import { useState } from 'react';

import CreateLanguageModal from '@/components/admin/languages/createLanguageModal';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Language, type Paginated, type SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Languages',
        href: '/languages',
    },
];

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

function formatDate(value: string): string {
    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

export default function LanguageIndex({ languages }: { languages: Paginated<Language> }) {
    const { flash } = usePage<SharedData>().props;
    const [open, setOpen] = useState(false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Languages" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-semibold">Languages</h1>
                        <p className="text-muted-foreground text-sm">Languages used by your dictionaries.</p>
                    </div>

                    <Button
                        className="me-2 inline-flex w-fit items-center gap-2 rounded-md bg-black px-4 py-2 text-sm text-white transition-colors hover:bg-gray-900 max-sm:px-2 max-sm:py-1.5 max-sm:text-xs"
                        onClick={() => setOpen(true)}
                    >
                        <Plus className="size-4" />
                        Add language
                    </Button>
                </div>

                {flash?.status && (
                    <div
                        role="status"
                        className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-300"
                    >
                        {flash.status}
                    </div>
                )}

                <CreateLanguageModal open={open} onOpenChange={setOpen} />

                <div className="border-sidebar-border/70 dark:border-sidebar-border bg-card overflow-hidden rounded-xl border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">#</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead className="text-right">Entries</TableHead>
                                <TableHead className="hidden sm:table-cell">Created</TableHead>
                                <TableHead className="">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {languages.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <BookOpen className="text-muted-foreground size-8" />
                                            <p className="font-medium">No languages yet</p>
                                            <p className="text-muted-foreground text-sm">Languages will appear here once they are added.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                languages.data.map((language, index) => (
                                    <TableRow key={language.id}>
                                        <TableCell className="text-muted-foreground tabular-nums">{(languages.from ?? 1) + index}</TableCell>
                                        <TableCell className="font-medium">
                                            <span className="block max-w-[24rem] truncate" title={language.name}>
                                                {language.name}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono uppercase">
                                                {language.code}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right tabular-nums">
                                            {language.dictionary_entities_count.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground hidden sm:table-cell">
                                            {formatDate(language.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button className="size-8 transition-colors" size="icon" variant="outline">
                                                    <Pencil></Pencil>
                                                </Button>
                                                <Button className="size-8 bg-red-700 text-white transition-colors" size="icon" variant="outline">
                                                    <Trash></Trash>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {languages.total > 0 && (
                        <div className="border-t px-4 py-3">
                            <Pagination paginator={languages} />
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
