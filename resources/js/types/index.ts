import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    flash?: { status?: string | null };
    [key: string]: unknown;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

export interface Language {
    id: number;
    name: string;
    code: string;
    dictionary_entities_count: number;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user';
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export type DictionaryImportStatus = 'uploaded' | 'processing' | 'ready' | 'importing' | 'completed' | 'failed' | 'cancelled';

export interface DictionaryLanguage {
    id: number;
    name: string;
    code: string;
}

export interface DictionarySource {
    id: number;
    title: string;
    author: string;
    publisher: string;
    publication_year: number;
}

export interface DictionaryImport {
    id: number;
    status: DictionaryImportStatus;
    language: DictionaryLanguage | null;
    original_name: string;
    size: number;
    pages: number | null;
    total_rows: number;
    imported_rows: number;
    skipped_rows: number;
    failed_rows: number;
    parser: string | null;
    error_message: string | null;
    source: DictionarySource | null;
    created_at: string | null;
    started_at: string | null;
    finished_at: string | null;
}

export interface DictionaryImportRowPreview {
    row_number: number;
    page: number | null;
    headword: string;
    part_of_speech: string | null;
    raw_part_of_speech: string | null;
    definition: string | null;
    status: string;
}

export interface DictionaryImportPreview {
    pos_breakdown: Array<{ part_of_speech: string | null; count: number }>;
    duplicate_count: number;
    sample: DictionaryImportRowPreview[];
}

export interface DictionaryImportDetail {
    import: DictionaryImport;
    preview: DictionaryImportPreview | null;
}

export interface DictionaryImportResult {
    message: string;
    imported: number;
    skipped: number;
    failed: number;
    import: DictionaryImport;
}

export interface DictionaryStats {
    languages: number;
    entries: number;
    imports: number;
}

export interface DictionaryEntry {
    id: number;
    word: string;
    part_of_speech: string | null;
    definition: string | null;
    source_page: number | null;
    language: DictionaryLanguage | null;
}

export interface DictionaryEntryFilters {
    search: string;
    language_id: number | null;
}
