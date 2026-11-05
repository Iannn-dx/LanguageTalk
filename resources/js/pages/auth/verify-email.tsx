import { Head, router, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

interface Props {
    email: string;
}

export default function VerifyEmail({ email }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        otp: '',
    });

    const { flash } = usePage<{ flash?: { status?: string } }>().props;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.verify'));
    };

    const resend = () => {
        router.post(route('verification.resend'));
    };

    return (
        <AuthLayout title="Verify your email" description={`We sent a 6-digit verification code to ${email}.`}>
            <Head title="Email verification" />

            {flash?.status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {flash.status}
                </div>
            )}

            <form onSubmit={submit} className="flex flex-col gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="otp">Verification code</Label>

                    <Input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        autoFocus
                        value={data.otp}
                        onChange={(e) => setData('otp', e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        disabled={processing}
                        className="text-center text-2xl tracking-[12px]"
                    />

                    <InputError message={errors.otp} className="mt-2" />
                </div>

                <Button type="submit" className="w-full" disabled={processing || data.otp.length !== 6}>
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Verify email
                </Button>
            </form>

            <div className="text-muted-foreground mt-6 space-y-3 text-center text-sm">
                <p>Didn't receive your code?</p>

                <Button type="button" variant="secondary" onClick={resend} disabled={processing}>
                    Resend verification code
                </Button>

                <p className="text-xs">
                    The code expires after 5 minutes.
                </p>

                <TextLink href={route('login')} className="block text-sm">
                    Back to log in
                </TextLink>
            </div>
        </AuthLayout>
    );
}
