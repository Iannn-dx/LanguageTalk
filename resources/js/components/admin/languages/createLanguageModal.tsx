import { Button, Input } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { Label } from '@radix-ui/react-dropdown-menu';
import LanguageModal from './languageModal';

interface CreateLanguageModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateLanguageModa({ open, onOpenChange }: CreateLanguageModalProps) {
    const form = useForm({
        name: '',
        code: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        form.post(route('admin/languages/store'), {
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
            },
        });
    };

    return (
        <LanguageModal open={open} onOpenChange={onOpenChange} title="Create Language">
            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                    <Label>Language Name</Label>
                    <Input
                        id="name"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        placeholder="Enter Language name"
                    ></Input>
                    {form.errors.name && <p className="text-sm text-red-500">{form.errors.name}</p>}
                </div>

                <div className="space-y-2">
                    <Label>Language Name</Label>
                    <Input
                        id="code"
                        value={form.data.code}
                        onChange={(e) => form.setData('code', e.target.value)}
                        placeholder="e.g. ibg, itw, ilk"
                    ></Input>
                    {form.errors.code && <p className="text-sm text-red-500">{form.errors.code}</p>}
                </div>

                {/*  */}
                <div className="flex justify-end gap-2">
                    <Button type="button" onClick={() => onOpenChange(false)} className="inline-flex w-fit max-sm:py-1.5 max-sm:px-2 max-sm:text-xs items-center gap-2 rounded-md bg-red-700 px-4 py-2 me-2 text-sm text-white transition-colors hover:bg-gray-900">
                        Cancel
                    </Button>

                    <Button type="submit" disabled={form.processing} className="inline-flex w-fit max-sm:py-1.5 max-sm:px-2 max-sm:text-xs items-center gap-2 rounded-md bg-black px-4 py-2 me-2 text-sm text-white transition-colors hover:bg-gray-900">
                        {form.processing ? 'Saving...' : 'Save Language'}
                    </Button>
                </div>
            </form>
        </LanguageModal>
    );
}
