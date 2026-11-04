// // Components
// import { Head, useForm } from '@inertiajs/react';
// import { LoaderCircle } from 'lucide-react';
// import { FormEventHandler } from 'react';

// import TextLink from '@/components/text-link';
// import { Button } from '@/components/ui/button';
// import AuthLayout from '@/layouts/auth-layout';

// export default function VerifyEmail({ status }: { status?: string }) {
//     const { post, processing } = useForm({});

//     const submit: FormEventHandler = (e) => {
//         e.preventDefault();

//         post(route('verification.send'));
//     };

//     return (
//         <AuthLayout title="Verify email" description="Please verify your email address by clicking on the link we just emailed to you.">
//             <Head title="Email verification" />

//             {status === 'verification-link-sent' && (
//                 <div className="mb-4 text-center text-sm font-medium text-green-600">
//                     A new verification link has been sent to the email address you provided during registration.
//                 </div>
//             )}

//             <form onSubmit={submit} className="space-y-6 text-center">
//                 <Button disabled={processing} variant="secondary">
//                     {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
//                     Resend verification email
//                 </Button>

//                 <TextLink href={route('logout')} method="post" className="mx-auto block text-sm">
//                     Log out
//                 </TextLink>
//             </form>
//         </AuthLayout>
//     );
// }

import { useForm, router } from '@inertiajs/react';

interface Props {
    email: string;
}

export default function VerifyEmail({ email }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        otp: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/verify-email');
    };

    const resend = () => {
        router.post('/verify-email/resend');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">

            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

                <div className="text-center mb-8">

                    <div className="text-4xl mb-4">
                        ✉️
                    </div>

                    <h1 className="text-2xl font-bold">
                        Verify your email
                    </h1>

                    <p className="text-gray-500 mt-2">
                        We sent a 6-digit verification code to
                    </p>

                    <p className="font-semibold mt-1">
                        {email}
                    </p>

                </div>

                <form onSubmit={submit}>

                    <label className="block text-sm font-medium mb-2">
                        Verification code
                    </label>

                    <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={data.otp}
                        onChange={(e) =>
                            setData('otp', e.target.value.replace(/\D/g, ''))
                        }
                        placeholder="000000"
                        className="w-full rounded-lg border px-4 py-3 text-center text-2xl tracking-[12px] focus:ring-2 focus:ring-blue-500 outline-none"
                    />

                    {errors.otp && (
                        <p className="text-red-500 text-sm mt-2">
                            {errors.otp}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={processing || data.otp.length !== 6}
                        className="w-full mt-6 rounded-lg bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                        {processing ? 'Verifying...' : 'Verify email'}
                    </button>

                </form>

                <div className="text-center mt-6">

                    <p className="text-sm text-gray-500 mb-3">
                        Didn't receive your code?
                    </p>

                    <button
                        type="button"
                        onClick={resend}
                        className="text-blue-600 font-semibold hover:underline"
                    >
                        Resend verification code
                    </button>

                </div>

                <div className="text-center mt-6">
                    <p className="text-xs text-gray-400">
                        Your verification code expires after 5 minutes.
                    </p>
                </div>

            </div>

        </div>
    );
}
