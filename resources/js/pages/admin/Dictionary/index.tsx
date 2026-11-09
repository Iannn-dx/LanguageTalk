import { Head, router } from '@inertiajs/react';
import { BookOpen, FileText, History, Languages, Loader2, Search, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import {
    type BreadcrumbItem,
    type DictionaryEntry,
    type DictionaryEntryFilters,
    type DictionaryImport,
    type DictionaryImportStatus,
    type DictionaryLanguage,
    type DictionaryStats,
    type Paginated,
} from '@/types';

import ImportDictionaryModal from './import.modal';

const ALL_LANGUAGES = 'all';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dictionary',
        href: '/dictionary',
    },
];

interface DictionaryPageProps {
    languages: DictionaryLanguage[];
    imports: DictionaryImport[];
    entries: Paginated<DictionaryEntry>;
    filters: DictionaryEntryFilters;
    stats: DictionaryStats;
}

const numberFormatter = new Intl.NumberFormat('en');

const dateTimeFormatter = new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

const statusMeta: Record<DictionaryImportStatus, { label: string; className: string }> = {
    uploaded: {
        label: 'Queued',
        className: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
    },
    processing: {
        label: 'Parsing',
        className: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-900/20 dark:text-sky-300',
    },
    ready: {
        label: 'Ready',
        className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300',
    },
    importing: {
        label: 'Importing',
        className: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-900/20 dark:text-sky-300',
    },
    completed: {
        label: 'Completed',
        className: 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-900/20 dark:text-green-300',
    },
    failed: {
        label: 'Failed',
        className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-300',
    },
    cancelled: {
        label: 'Cancelled',
        className: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
};

function formatDateTime(value: string | null): string {
    if (value === null) {
        return '—';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date);
}

function rowsLabel(dictionaryImport: DictionaryImport): string {
    if (dictionaryImport.status === 'completed') {
        const imported = `${numberFormatter.format(dictionaryImport.imported_rows)} imported`;

        return dictionaryImport.skipped_rows > 0 ? `${imported} · ${numberFormatter.format(dictionaryImport.skipped_rows)} skipped` : imported;
    }

    if (dictionaryImport.total_rows > 0) {
        return `${numberFormatter.format(dictionaryImport.total_rows)} staged`;
    }

    return '—';
}

export default function Dictionary({ languages, imports, entries, filters, stats }: DictionaryPageProps) {
    const [wizardOpen, setWizardOpen] = useState(false);
    const [reviewImportId, setReviewImportId] = useState<number | null>(null);
    const [discardingId, setDiscardingId] = useState<number | null>(null);
    const [search, setSearch] = useState(filters.search);
    const [languageId, setLanguageId] = useState(filters.language_id === null ? ALL_LANGUAGES : String(filters.language_id));

    const hasFilters = filters.search !== '' || filters.language_id !== null;

    // Keep the controls in sync with the URL (pagination, back/forward navigation).
    useEffect(() => {
        setSearch(filters.search);
        setLanguageId(filters.language_id === null ? ALL_LANGUAGES : String(filters.language_id));
    }, [filters.search, filters.language_id]);

    const applyFilters = (nextSearch: string, nextLanguageId: string) => {
        const params: Record<string, string> = {};
        const trimmed = nextSearch.trim();

        if (trimmed !== '') {
            params.search = trimmed;
        }

        if (nextLanguageId !== ALL_LANGUAGES) {
            params.language_id = nextLanguageId;
        }

        router.get(route('dictionary'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const clearFilters = () => {
        setSearch('');
        setLanguageId(ALL_LANGUAGES);
        router.get(route('dictionary'), {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const openUpload = () => {
        setReviewImportId(null);
        setWizardOpen(true);
    };

    const openReview = (dictionaryImport: DictionaryImport) => {
        setReviewImportId(dictionaryImport.id);
        setWizardOpen(true);
    };

    const refreshImports = () => {
        router.reload({ only: ['imports', 'stats'] });
    };

    const discardImport = async (dictionaryImport: DictionaryImport) => {
        const message =
            dictionaryImport.status === 'completed'
                ? `Delete the import record for "${dictionaryImport.original_name}"? The imported entries stay in the dictionary.`
                : `Discard the import of "${dictionaryImport.original_name}"? The uploaded PDF and staged entries will be removed.`;

        if (!window.confirm(message)) {
            return;
        }

        setDiscardingId(dictionaryImport.id);

        try {
            const response = await fetch(route('dictionary.imports.destroy', dictionaryImport.id), {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
            });

            if (!response.ok) {
                const body = await response.json().catch(() => null);
                window.alert(body?.message ?? 'The import could not be discarded. Please try again.');

                return;
            }

            router.reload({ only: ['imports', 'stats'] });
        } catch {
            window.alert('The import could not be discarded. Check your connection and try again.');
        } finally {
            setDiscardingId(null);
        }
    };

    const cards = [
        {
            title: 'Languages',
            value: stats.languages,
            description: 'Languages available for dictionary imports.',
            icon: Languages,
        },
        {
            title: 'Dictionary entries',
            value: stats.entries,
            description: 'Entries stored across every language.',
            icon: BookOpen,
        },
        {
            title: 'Imports',
            value: stats.imports,
            description: 'PDF imports processed so far.',
            icon: History,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dictionary" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-semibold">Dictionary</h1>
                        <p className="text-muted-foreground text-sm">Import and review your local language dictionaries.</p>
                    </div>
                    <Button
                        className="me-2 inline-flex w-fit items-center gap-2 rounded-md bg-black px-4 py-2 text-sm text-white transition-colors hover:bg-gray-900 max-sm:px-2 max-sm:py-1.5 max-sm:text-xs"
                        onClick={openUpload}
                    >
                        <Upload className="size-4" />
                        Import
                    </Button>
                </div>

                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {cards.map((card) => (
                        <div key={card.title} className="border-sidebar-border/70 dark:border-sidebar-border rounded-xl border p-6">
                            <card.icon className="text-muted-foreground size-5" />
                            <p className="mt-4 text-2xl font-semibold tabular-nums">{numberFormatter.format(card.value)}</p>
                            <p className="mt-1 font-medium">{card.title}</p>
                            <p className="text-muted-foreground mt-1 text-sm">{card.description}</p>
                        </div>
                    ))}
                </div>

                <div className="border-sidebar-border/70 dark:border-sidebar-border bg-card overflow-hidden rounded-xl border">
                    <div className="flex flex-col justify-between gap-1 border-b px-4 py-3">
                        <div>
                            <h2 className="font-semibold">Dictionary entries</h2>
                            <p className="text-muted-foreground text-sm">
                                {entries.total === 0
                                    ? 'Entries imported from dictionary PDFs.'
                                    : `${numberFormatter.format(entries.total)} ${entries.total === 1 ? 'entry' : 'entries'}${
                                          hasFilters
                                              ? entries.total === 1
                                                  ? ' matches your filters'
                                                  : ' match your filters'
                                              : ' across all languages'
                                      }.`}
                            </p>
                        </div>

                        <form
                            className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center"
                            onSubmit={(event) => {
                                event.preventDefault();
                                applyFilters(search, languageId);
                            }}
                        >
                            <div className="relative flex-1">
                                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                <Input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search headwords…"
                                    aria-label="Search entries by headword"
                                    className="pl-9"
                                />
                            </div>

                            <Select
                                value={languageId}
                                onValueChange={(value) => {
                                    setLanguageId(value);
                                    applyFilters(search, value);
                                }}
                            >
                                <SelectTrigger className="w-full sm:w-52" aria-label="Filter entries by language">
                                    <SelectValue placeholder="All languages" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL_LANGUAGES}>All languages</SelectItem>
                                    {languages.map((language) => (
                                        <SelectItem key={language.id} value={String(language.id)}>
                                            {language.name}
                                            <span className="text-muted-foreground ml-2 font-mono text-xs">{language.code}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button type="submit" variant="outline">
                                <Search className="size-4" />
                                Search
                            </Button>

                            {hasFilters && (
                                <Button type="button" variant="ghost" onClick={clearFilters}>
                                    <X className="size-4" />
                                    Clear
                                </Button>
                            )}
                        </form>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Headword</TableHead>
                                <TableHead className="w-28">POS</TableHead>
                                <TableHead>Definition</TableHead>
                                <TableHead className="hidden w-20 text-right sm:table-cell">Page</TableHead>
                                <TableHead className="hidden w-40 md:table-cell">Language</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <BookOpen className="text-muted-foreground size-8" />
                                            <p className="font-medium">{hasFilters ? 'No entries match your filters' : 'No entries yet'}</p>
                                            <p className="text-muted-foreground text-sm">
                                                {hasFilters
                                                    ? 'Try a different headword or clear the language filter.'
                                                    : 'Import a dictionary PDF to populate the entries table.'}
                                            </p>
                                            {hasFilters && (
                                                <Button className="mt-2" variant="outline" size="sm" onClick={clearFilters}>
                                                    Clear filters
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                entries.data.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell className="font-medium">
                                            <span className="block max-w-[20rem] truncate" title={entry.word}>
                                                {entry.word}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {entry.part_of_speech === null ? (
                                                <span className="text-muted-foreground text-sm">—</span>
                                            ) : (
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {entry.part_of_speech}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {entry.definition === null ? (
                                                '—'
                                            ) : (
                                                <span className="line-clamp-2 max-w-[38rem]" title={entry.definition}>
                                                    {entry.definition}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground hidden text-right tabular-nums sm:table-cell">
                                            {entry.source_page ?? '—'}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {entry.language === null ? (
                                                <span className="text-muted-foreground text-sm">—</span>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="max-w-[9rem] truncate">{entry.language.name}</span>
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {entry.language.code}
                                                    </Badge>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {entries.data.length > 0 && (
                        <div className="border-t px-4 py-3">
                            <Pagination paginator={entries} />
                        </div>
                    )}
                </div>

                <div className="border-sidebar-border/70 dark:border-sidebar-border bg-card overflow-hidden rounded-xl border">
                    <div className="flex flex-col justify-between gap-1 border-b px-4 py-3 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="font-semibold">Recent imports</h2>
                            <p className="text-muted-foreground text-sm">The last 10 dictionary PDFs you uploaded.</p>
                        </div>
                        {imports.length > 0 && <p className="text-muted-foreground text-sm">{numberFormatter.format(stats.imports)} total</p>}
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>File</TableHead>
                                <TableHead className="hidden sm:table-cell">Language</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden md:table-cell">Rows</TableHead>
                                <TableHead className="hidden md:table-cell">Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {imports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <History className="text-muted-foreground size-8" />
                                            <p className="font-medium">No imports yet</p>
                                            <p className="text-muted-foreground text-sm">Upload a dictionary PDF to see it here.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                imports.map((dictionaryImport) => {
                                    const status = statusMeta[dictionaryImport.status];
                                    const canDiscard = !['processing', 'importing'].includes(dictionaryImport.status);

                                    return (
                                        <TableRow key={dictionaryImport.id}>
                                            <TableCell>
                                                <div className="flex items-start gap-2">
                                                    <FileText className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                                                    <div className="min-w-0">
                                                        <span
                                                            className="block max-w-[18rem] truncate font-medium"
                                                            title={dictionaryImport.original_name}
                                                        >
                                                            {dictionaryImport.original_name}
                                                        </span>
                                                        {dictionaryImport.source !== null ? (
                                                            <span
                                                                className="text-muted-foreground block max-w-[18rem] truncate text-xs"
                                                                title={dictionaryImport.source.title}
                                                            >
                                                                {dictionaryImport.source.title}
                                                            </span>
                                                        ) : dictionaryImport.status === 'failed' && dictionaryImport.error_message ? (
                                                            <span
                                                                className="block max-w-[18rem] truncate text-xs text-red-600 dark:text-red-400"
                                                                title={dictionaryImport.error_message}
                                                            >
                                                                {dictionaryImport.error_message}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                {dictionaryImport.language === null ? (
                                                    <span className="text-muted-foreground text-sm">—</span>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="max-w-[10rem] truncate">{dictionaryImport.language.name}</span>
                                                        <Badge variant="outline" className="font-mono text-xs">
                                                            {dictionaryImport.language.code}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={status.className}>
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground hidden tabular-nums md:table-cell">
                                                {rowsLabel(dictionaryImport)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground hidden md:table-cell">
                                                {formatDateTime(dictionaryImport.created_at)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-1">
                                                    {dictionaryImport.status === 'ready' && (
                                                        <Button size="sm" variant="outline" onClick={() => openReview(dictionaryImport)}>
                                                            Review
                                                        </Button>
                                                    )}
                                                    {canDiscard && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="text-muted-foreground hover:text-destructive"
                                                            onClick={() => void discardImport(dictionaryImport)}
                                                            disabled={discardingId === dictionaryImport.id}
                                                            title={
                                                                dictionaryImport.status === 'completed' ? 'Delete import record' : 'Discard import'
                                                            }
                                                        >
                                                            {discardingId === dictionaryImport.id ? (
                                                                <Loader2 className="size-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="size-4" />
                                                            )}
                                                            <span className="sr-only">Discard import</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <ImportDictionaryModal
                open={wizardOpen}
                onOpenChange={setWizardOpen}
                languages={languages}
                reviewImportId={reviewImportId}
                onFinished={refreshImports}
            />
        </AppLayout>
    );
}
