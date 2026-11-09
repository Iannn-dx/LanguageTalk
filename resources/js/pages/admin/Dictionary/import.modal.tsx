import { AlertTriangle, Check, CheckCircle2, FileText, Loader2, UploadCloud } from 'lucide-react';
import { type DragEvent, type KeyboardEvent, type RefObject, useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { type DictionaryImport, type DictionaryImportDetail, type DictionaryImportResult, type DictionaryLanguage } from '@/types';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const POLL_INTERVAL = 1500;
const IN_PROGRESS_STATUSES = ['uploaded', 'processing', 'importing'];

type WizardStep = 'upload' | 'review' | 'done';
type BusyState = 'uploading' | 'confirming' | 'discarding' | null;

interface ImportDictionaryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    languages: DictionaryLanguage[];
    reviewImportId?: number | null;
    onFinished: () => void;
}

interface RequestErrorBody {
    message?: string;
    errors?: Record<string, string[]>;
}

const steps: Array<{ key: WizardStep; label: string }> = [
    { key: 'upload', label: 'Upload' },
    { key: 'review', label: 'Review' },
    { key: 'done', label: 'Done' },
];

function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatNumber(value: number): string {
    return value.toLocaleString();
}

async function readJson<T>(response: Response): Promise<T | null> {
    return response.json().catch(() => null);
}

export default function ImportDictionaryModal({ open, onOpenChange, languages, reviewImportId = null, onFinished }: ImportDictionaryModalProps) {
    const [step, setStep] = useState<WizardStep>('upload');
    const [busy, setBusy] = useState<BusyState>(null);
    const [languageId, setLanguageId] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [importId, setImportId] = useState<number | null>(null);
    const [detail, setDetail] = useState<DictionaryImportDetail | null>(null);
    const [result, setResult] = useState<DictionaryImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset the wizard whenever it is opened, optionally resuming a parsed import.
    useEffect(() => {
        if (!open) {
            return;
        }

        setStep(reviewImportId === null ? 'upload' : 'review');
        setBusy(null);
        setLanguageId('');
        setFile(null);
        setDragActive(false);
        setImportId(reviewImportId);
        setDetail(null);
        setResult(null);
        setError(null);
        setFieldErrors({});
    }, [open, reviewImportId]);

    // Poll the staging status until the import is ready, failed, or finished.
    useEffect(() => {
        if (!open || step !== 'review' || importId === null) {
            return;
        }

        let cancelled = false;
        let timer: number | undefined;

        const poll = async () => {
            try {
                const response = await fetch(route('dictionary.imports.show', importId), {
                    headers: { Accept: 'application/json' },
                });

                const body = await readJson<DictionaryImportDetail>(response);

                if (cancelled) {
                    return;
                }

                if (!response.ok || body === null) {
                    setError('Unable to load the import status. Retrying…');
                    timer = window.setTimeout(poll, POLL_INTERVAL * 2);

                    return;
                }

                setDetail(body);
                setError(null);

                if (IN_PROGRESS_STATUSES.includes(body.import.status)) {
                    timer = window.setTimeout(poll, POLL_INTERVAL);
                }
            } catch {
                if (cancelled) {
                    return;
                }

                setError('Unable to load the import status. Retrying…');
                timer = window.setTimeout(poll, POLL_INTERVAL * 2);
            }
        };

        void poll();

        return () => {
            cancelled = true;

            if (timer) {
                window.clearTimeout(timer);
            }
        };
    }, [open, step, importId]);

    const activeImport: DictionaryImport | null = detail?.import ?? null;
    const preview = detail?.preview ?? null;
    const activeStepIndex = step === 'upload' ? 0 : step === 'review' ? 1 : 2;
    const canDiscardActive = activeImport !== null && !['processing', 'importing'].includes(activeImport.status);

    const resetFieldError = (field: string) => {
        setFieldErrors((current) => {
            if (!(field in current)) {
                return current;
            }

            const next = { ...current };
            delete next[field];

            return next;
        });
    };

    const pickFile = (nextFile: File | null) => {
        setError(null);

        if (nextFile === null) {
            return;
        }

        if (!nextFile.name.toLowerCase().endsWith('.pdf') && nextFile.type !== 'application/pdf') {
            setFile(null);
            setFieldErrors((current) => ({ ...current, file: 'Choose a PDF file.' }));

            return;
        }

        if (nextFile.size > MAX_FILE_SIZE) {
            setFile(null);
            setFieldErrors((current) => ({ ...current, file: 'The PDF must be 25 MB or smaller.' }));

            return;
        }

        resetFieldError('file');
        setFile(nextFile);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragActive(false);

        if (busy !== null) {
            return;
        }

        pickFile(event.dataTransfer.files?.[0] ?? null);
    };

    const openFilePicker = () => {
        if (busy === null) {
            fileInputRef.current?.click();
        }
    };

    const handleDropzoneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openFilePicker();
        }
    };

    const upload = async () => {
        if (file === null || languageId === '') {
            setError('Choose a language and a PDF to continue.');

            return;
        }

        setBusy('uploading');
        setError(null);
        setFieldErrors({});

        const form = new FormData();
        form.append('language_id', languageId);
        form.append('file', file);

        try {
            const response = await fetch(route('dictionary.imports.store'), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: form,
            });

            const body = await readJson<{ message: string; import: DictionaryImport } & RequestErrorBody>(response);

            if (!response.ok || body === null) {
                if (body?.errors) {
                    setFieldErrors(Object.fromEntries(Object.entries(body.errors).map(([key, messages]) => [key, messages[0]])));
                }

                setError(body?.message ?? 'The PDF could not be uploaded. Please try again.');
                setBusy(null);

                return;
            }

            setImportId(body.import.id);
            setDetail({ import: body.import, preview: null });
            setStep('review');
            setBusy(null);
        } catch {
            setError('The PDF could not be uploaded. Check your connection and try again.');
            setBusy(null);
        }
    };

    const confirmImport = async () => {
        if (importId === null) {
            return;
        }

        setBusy('confirming');
        setError(null);

        try {
            const response = await fetch(route('dictionary.imports.confirm', importId), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
            });

            const body = await readJson<DictionaryImportResult & RequestErrorBody>(response);

            if (!response.ok || body === null) {
                setError(body?.message ?? 'The import could not be completed. Please try again.');
                setBusy(null);

                return;
            }

            setResult(body);
            setDetail((current) => (current === null ? current : { import: body.import, preview: current.preview }));
            setStep('done');
            setBusy(null);
            onFinished();
        } catch {
            setError('The import could not be completed. Check your connection and try again.');
            setBusy(null);
        }
    };

    const discardImport = async () => {
        if (importId === null) {
            close();

            return;
        }

        setBusy('discarding');
        setError(null);

        try {
            const response = await fetch(route('dictionary.imports.destroy', importId), {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
            });

            if (!response.ok) {
                const body = await readJson<RequestErrorBody>(response);
                setError(body?.message ?? 'The import could not be discarded. Please try again.');
                setBusy(null);

                return;
            }

            onFinished();
            setBusy(null);
            onOpenChange(false);
        } catch {
            setError('The import could not be discarded. Check your connection and try again.');
            setBusy(null);
        }
    };

    const close = () => {
        if (busy !== null) {
            return;
        }

        onOpenChange(false);
    };

    const handleOpenChange = (nextOpen: boolean) => {
        // Don't let the dialog close while a request is in flight.
        if (!nextOpen && busy !== null) {
            return;
        }

        onOpenChange(nextOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{step === 'done' ? 'Import complete' : step === 'review' ? 'Review import' : 'Import dictionary'}</DialogTitle>
                    <DialogDescription>
                        {step === 'done'
                            ? 'The staged entries have been imported into your dictionary.'
                            : step === 'review'
                              ? 'Check the parsed entries before adding them to the dictionary.'
                              : 'Choose a language and upload a PDF of the dictionary.'}
                    </DialogDescription>
                </DialogHeader>

                <StepIndicator activeIndex={activeStepIndex} />

                {error !== null && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-300"
                    >
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {step === 'upload' && (
                    <UploadStep
                        languages={languages}
                        languageId={languageId}
                        onLanguageChange={(value) => {
                            resetFieldError('language_id');
                            setLanguageId(value);
                        }}
                        file={file}
                        dragActive={dragActive}
                        fieldErrors={fieldErrors}
                        busy={busy}
                        fileInputRef={fileInputRef}
                        onDrop={handleDrop}
                        onDragActiveChange={setDragActive}
                        onDropzoneKeyDown={handleDropzoneKeyDown}
                        onOpenFilePicker={openFilePicker}
                        onPickFile={pickFile}
                    />
                )}

                {step === 'review' && <ReviewStep importRecord={activeImport} preview={preview} />}

                {step === 'done' && result !== null && <DoneStep result={result} />}

                <DialogFooter className="gap-2 pt-2 sm:space-x-0">
                    {step === 'upload' && (
                        <>
                            <Button type="button" variant="outline" onClick={close} disabled={busy !== null}>
                                Cancel
                            </Button>
                            <Button type="button" onClick={upload} disabled={busy !== null || file === null || languageId === ''}>
                                {busy === 'uploading' ? <Loader2 className="animate-spin" /> : <UploadCloud />}
                                {busy === 'uploading' ? 'Uploading…' : 'Upload & parse'}
                            </Button>
                        </>
                    )}

                    {step === 'review' && (
                        <>
                            <Button type="button" variant="outline" onClick={close} disabled={busy !== null}>
                                Close
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={discardImport}
                                disabled={busy !== null || !canDiscardActive}
                            >
                                {busy === 'discarding' && <Loader2 className="animate-spin" />}
                                Discard
                            </Button>
                            <Button type="button" onClick={confirmImport} disabled={busy !== null || activeImport?.status !== 'ready'}>
                                {busy === 'confirming' && <Loader2 className="animate-spin" />}
                                Confirm import
                            </Button>
                        </>
                    )}

                    {step === 'done' && (
                        <Button type="button" onClick={close}>
                            Done
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function StepIndicator({ activeIndex }: { activeIndex: number }) {
    return (
        <div className="flex items-center gap-2">
            {steps.map((step, index) => {
                const isComplete = index < activeIndex;
                const isActive = index === activeIndex;

                return (
                    <div key={step.key} className="flex flex-1 items-center gap-2 last:flex-none">
                        {index > 0 && <div className={cn('bg-border h-px flex-1', index <= activeIndex && 'bg-primary')} />}
                        <div className="flex items-center gap-2">
                            <span
                                className={cn(
                                    'flex size-6 items-center justify-center rounded-full border text-xs font-medium',
                                    isComplete && 'border-primary bg-primary text-primary-foreground',
                                    isActive && !isComplete && 'border-primary text-primary',
                                    !isActive && !isComplete && 'text-muted-foreground',
                                )}
                            >
                                {isComplete ? <Check className="size-3.5" /> : index + 1}
                            </span>
                            <span className={cn('text-xs font-medium', isActive || isComplete ? 'text-foreground' : 'text-muted-foreground')}>
                                {step.label}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

interface UploadStepProps {
    languages: DictionaryLanguage[];
    languageId: string;
    onLanguageChange: (value: string) => void;
    file: File | null;
    dragActive: boolean;
    fieldErrors: Record<string, string>;
    busy: BusyState;
    fileInputRef: RefObject<HTMLInputElement | null>;
    onDrop: (event: DragEvent<HTMLDivElement>) => void;
    onDragActiveChange: (active: boolean) => void;
    onDropzoneKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
    onOpenFilePicker: () => void;
    onPickFile: (file: File | null) => void;
}

function UploadStep({
    languages,
    languageId,
    onLanguageChange,
    file,
    dragActive,
    fieldErrors,
    busy,
    fileInputRef,
    onDrop,
    onDragActiveChange,
    onDropzoneKeyDown,
    onOpenFilePicker,
    onPickFile,
}: UploadStepProps) {
    if (languages.length === 0) {
        return (
            <div className="rounded-lg border border-dashed px-6 py-10 text-center">
                <p className="font-medium">No languages yet</p>
                <p className="text-muted-foreground mt-1 text-sm">Add a language before importing a dictionary.</p>
                <Button asChild className="mt-4" variant="outline">
                    <a href={route('languages.index')}>Manage languages</a>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="import-language">Language</Label>
                <Select value={languageId} onValueChange={onLanguageChange}>
                    <SelectTrigger id="import-language" disabled={busy !== null}>
                        <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                        {languages.map((language) => (
                            <SelectItem key={language.id} value={String(language.id)}>
                                {language.name}
                                <span className="text-muted-foreground ml-2 font-mono text-xs">{language.code}</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {fieldErrors.language_id && <p className="text-destructive text-sm">{fieldErrors.language_id}</p>}
            </div>

            <div className="grid gap-2">
                <Label>PDF file</Label>
                <div
                    role="button"
                    tabIndex={0}
                    aria-disabled={busy !== null}
                    onClick={onOpenFilePicker}
                    onKeyDown={onDropzoneKeyDown}
                    onDragOver={(event) => {
                        event.preventDefault();
                        onDragActiveChange(true);
                    }}
                    onDragLeave={() => onDragActiveChange(false)}
                    onDrop={onDrop}
                    className={cn(
                        'focus-visible:ring-ring flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2',
                        dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/40',
                        busy !== null && 'pointer-events-none opacity-60',
                    )}
                >
                    {file === null ? (
                        <>
                            <UploadCloud className="text-muted-foreground size-8" />
                            <p className="font-medium">Drop your PDF here, or click to browse</p>
                            <p className="text-muted-foreground text-xs">PDF only, up to 25 MB.</p>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 font-medium">
                                <FileText className="size-4" />
                                <span className="max-w-[18rem] truncate" title={file.name}>
                                    {file.name}
                                </span>
                            </div>
                            <p className="text-muted-foreground text-xs">{formatBytes(file.size)} · click to replace</p>
                        </>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(event) => {
                        onPickFile(event.target.files?.[0] ?? null);
                        event.target.value = '';
                    }}
                />
                {fieldErrors.file && <p className="text-destructive text-sm">{fieldErrors.file}</p>}
            </div>
        </div>
    );
}

interface ReviewStepProps {
    importRecord: DictionaryImport | null;
    preview: DictionaryImportDetail['preview'];
}

function ReviewStep({ importRecord, preview }: ReviewStepProps) {
    if (importRecord === null) {
        return <ParsingState label="Waiting for the upload…" />;
    }

    if (importRecord.status === 'failed') {
        return (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm dark:border-red-900/60 dark:bg-red-900/20">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />
                <div>
                    <p className="font-medium text-red-700 dark:text-red-300">We couldn't parse this PDF</p>
                    <p className="text-muted-foreground mt-1">{importRecord.error_message ?? 'The file could not be processed.'}</p>
                    <p className="text-muted-foreground mt-2 text-xs">
                        Try a text-based PDF (scanned images have no extractable text) and upload it again.
                    </p>
                </div>
            </div>
        );
    }

    if (importRecord.status === 'completed') {
        return (
            <div className="rounded-lg border px-6 py-10 text-center">
                <CheckCircle2 className="mx-auto size-8 text-green-600 dark:text-green-400" />
                <p className="mt-2 font-medium">This import is already complete</p>
                <p className="text-muted-foreground mt-1 text-sm">
                    {formatNumber(importRecord.imported_rows)} entries imported, {formatNumber(importRecord.skipped_rows)} skipped.
                </p>
            </div>
        );
    }

    if (importRecord.status !== 'ready' || preview === null) {
        return <ParsingState label="Parsing your PDF…" fileName={importRecord.original_name} />;
    }

    const displayedSample = preview.sample.length;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryStat label="Pages" value={importRecord.pages === null ? '—' : formatNumber(importRecord.pages)} />
                <SummaryStat label="Entries found" value={formatNumber(importRecord.total_rows)} />
                <SummaryStat label="Duplicates" value={formatNumber(preview.duplicate_count)} />
                <SummaryStat label="Source" value={importRecord.source?.title ?? 'Unknown'} />
            </div>

            {preview.pos_breakdown.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {preview.pos_breakdown.map((part) => (
                        <Badge key={part.part_of_speech ?? 'unknown'} variant="outline" className="font-mono text-xs">
                            {part.part_of_speech ?? 'unknown'} · {formatNumber(part.count)}
                        </Badge>
                    ))}
                </div>
            )}

            <div className="max-h-64 overflow-auto rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Word</TableHead>
                            <TableHead className="w-16">POS</TableHead>
                            <TableHead>Definition</TableHead>
                            <TableHead className="w-14 text-right">Page</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {preview.sample.map((row) => (
                            <TableRow key={row.row_number}>
                                <TableCell className="text-muted-foreground tabular-nums">{row.row_number}</TableCell>
                                <TableCell className="font-medium">{row.headword}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="font-mono text-xs">
                                        {row.part_of_speech ?? '—'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground max-w-[20rem]">
                                    <span className="line-clamp-2" title={row.definition ?? undefined}>
                                        {row.definition}
                                    </span>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-right tabular-nums">{row.page ?? '—'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <p className="text-muted-foreground text-xs">
                Showing the first {formatNumber(displayedSample)} of {formatNumber(importRecord.total_rows)} staged entries.
                {preview.duplicate_count > 0 &&
                    ` ${formatNumber(preview.duplicate_count)} already exist or repeat within this import and will be skipped.`}
            </p>
        </div>
    );
}

function ParsingState({ label, fileName }: { label: string; fileName?: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Loader2 className="text-primary size-8 animate-spin" />
            <p className="font-medium">{label}</p>
            {fileName && <p className="text-muted-foreground max-w-sm truncate text-sm">{fileName}</p>}
            <p className="text-muted-foreground text-xs">This usually takes a few seconds. You can close this dialog and review it later.</p>
        </div>
    );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border px-3 py-2">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-0.5 truncate font-semibold" title={value}>
                {value}
            </p>
        </div>
    );
}

function DoneStep({ result }: { result: DictionaryImportResult }) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col items-center gap-2 py-4 text-center">
                <CheckCircle2 className="size-10 text-green-600 dark:text-green-400" />
                <p className="text-lg font-semibold">Import complete</p>
                <p className="text-muted-foreground text-sm">
                    {result.import.original_name} was imported into {result.import.language?.name ?? 'the dictionary'}.
                </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <ResultStat label="Imported" value={result.imported} tone="positive" />
                <ResultStat label="Skipped" value={result.skipped} />
                <ResultStat label="Failed" value={result.failed} />
            </div>
        </div>
    );
}

function ResultStat({ label, value, tone }: { label: string; value: number; tone?: 'positive' }) {
    return (
        <div className={cn('rounded-lg border px-3 py-3 text-center', tone === 'positive' && 'border-green-200 dark:border-green-900/60')}>
            <p className={cn('text-2xl font-semibold tabular-nums', tone === 'positive' && 'text-green-700 dark:text-green-300')}>
                {formatNumber(value)}
            </p>
            <p className="text-muted-foreground text-xs">{label}</p>
        </div>
    );
}
