import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type Paginated } from '@/types';

function normalizeLabel(label: string): string {
    return label.replace('&laquo;', '«').replace('&raquo;', '»').trim();
}

interface PaginationProps<T> {
    paginator: Paginated<T>;
    className?: string;
}

export function Pagination<T>({ paginator, className }: PaginationProps<T>) {
    const { from, to, total, last_page, links } = paginator;

    if (total === 0) {
        return null;
    }

    return (
        <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
            <p className="text-muted-foreground text-sm">
                Showing <span className="text-foreground font-medium">{from ?? 0}</span>–
                <span className="text-foreground font-medium">{to ?? 0}</span> of <span className="text-foreground font-medium">{total}</span>
            </p>

            {last_page > 1 && (
                <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1">
                    {links.map((link, index) => {
                        const isPrevious = index === 0;
                        const isNext = index === links.length - 1;
                        const isEllipsis = link.label === '...';
                        const label = normalizeLabel(link.label);

                        const content = (
                            <>
                                {isPrevious && <ChevronLeft className="size-4" />}
                                <span className={cn(isPrevious || isNext ? 'hidden sm:inline' : undefined)}>{label}</span>
                                {isNext && <ChevronRight className="size-4" />}
                            </>
                        );

                        if (!link.url || isEllipsis) {
                            return (
                                <span
                                    key={`${link.label}-${index}`}
                                    aria-disabled="true"
                                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'pointer-events-none min-w-9 opacity-50')}
                                >
                                    {content}
                                </span>
                            );
                        }

                        return (
                            <Link
                                key={`${link.label}-${index}`}
                                href={link.url}
                                preserveScroll
                                preserveState
                                aria-current={link.active ? 'page' : undefined}
                                className={cn(buttonVariants({ variant: link.active ? 'default' : 'ghost', size: 'sm' }), 'min-w-9')}
                            >
                                {content}
                            </Link>
                        );
                    })}
                </nav>
            )}
        </div>
    );
}
