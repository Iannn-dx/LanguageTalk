import { useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LanguageModal from './languageModal';

interface CreateLanguageModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateLanguageModal({ open, onOpenChange }: CreateLanguageModalProps) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        code: '',
    });

    const close = () => {
        reset();
        clearErrors();
        onOpenChange(false);
    };

    const handleOpenChange = (nextOpen: boolean) => {
        // Don't let the dialog close while the request is in flight.
        if (!nextOpen && processing) {
            return;
        }

        if (nextOpen) {
            onOpenChange(true);
        } else {
            close();
        }
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        post(route('languages.store'), {
            preserveScroll: true,
            onSuccess: close,
        });
    };

    return (
        <LanguageModal open={open} onOpenChange={handleOpenChange} title="Add language" description="Add a language to your dictionaries.">
            <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="language-name">Name</Label>
                    <Input
                        id="language-name"
                        name="name"
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        placeholder="e.g. Ibanag"
                        autoComplete="off"
                        autoFocus
                        required
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="language-code">Code</Label>
                    <Input
                        id="language-code"
                        name="code"
                        value={data.code}
                        onChange={(event) => setData('code', event.target.value)}
                        placeholder="e.g. ibg, itw, ilk"
                        autoComplete="off"
                        required
                    />
                    <p className="text-muted-foreground text-xs">A short ISO 639 code. It is saved in lowercase.</p>
                    <InputError message={errors.code} />
                </div>

                <DialogFooter className="gap-2 pt-2 sm:space-x-0">
                    <Button type="button" variant="outline" onClick={close} disabled={processing}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Saving…' : 'Save language'}
                    </Button>
                </DialogFooter>
            </form>
        </LanguageModal>
    );
}
