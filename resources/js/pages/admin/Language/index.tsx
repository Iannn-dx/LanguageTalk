import { Head } from '@inertiajs/react';
import { BookOpen } from 'lucide-react';
import { Upload } from 'lucide-react';

import { useState } from 'react';
import CreateLanguageModa from '@/components/admin/languages/createLanguageModal';
import { Button } from '@headlessui/react';
import { Plus } from 'lucide-react';

import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Language, type Paginated } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Languages',
        href: '/languages',
    },
];

export default function LanguageIndex({ languages }: { languages: Paginated<Language> }) {

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
                        <button onClick={() => setOpen(true)} className='inline-flex w-fit max-sm:py-1.5 max-sm:px-2 max-sm:text-xs items-center gap-2 rounded-md bg-black px-4 py-2 me-2 text-sm text-white transition-colors hover:bg-gray-900'>
                            <Upload className='size-4'></Upload>
                            Add Language</button>

                            <CreateLanguageModa open={open} onOpenChange={setOpen} ></CreateLanguageModa>
                </div>

                <div className="border-sidebar-border/70 dark:border-sidebar-border bg-card overflow-hidden rounded-xl border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">#</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead className="text-right">Entries</TableHead>
                                <TableHead className="hidden sm:table-cell">Created</TableHead>
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
                                        <TableCell className="text-muted-foreground hidden sm:table-cell"></TableCell>
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
