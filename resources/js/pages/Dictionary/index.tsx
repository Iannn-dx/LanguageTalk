import { Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {Head} from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dictionary',
    href: '/dictionary',
  }
]

export default function Dictionary() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title='Dictionary'></Head>
       <div className="min-h-screen bg-white p-8 dark:bg-neutral-950">
            <h1 className="text-3xl font-bold">
                Dictionary
            </h1>

            <p className="mt-2 text-neutral-500">
                Explore and discover local language words.
            </p>
        </div>
    </AppLayout>
  );
}