import { useAppearance } from '@/hooks/use-appearance';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, ArrowUpRight, Check, Copy, CornerDownLeft, Grid3X3, Moon, Play, Square, Sun, Terminal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const safeRoute = (name: string, fallback: string): string => {
    try {
        if (typeof route === 'function' && route().has(name)) {
            return route(name);
        }
    } catch {
    }
    return fallback;
};

export default function Welcome() {
    const { auth } = usePage<SharedData>().props || { auth: { user: null } };
    const { appearance, updateAppearance } = useAppearance();

    const [currentTime, setCurrentTime] = useState<string>('');
    const [currentUtc, setCurrentUtc] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'blueprint' | 'sample' | 'typography' | 'guide'>('blueprint');
    const [activeSpecIndex, setActiveSpecIndex] = useState<number>(0);
    const [gridOverlay, setGridOverlay] = useState<boolean>(false);
    const [email, setEmail] = useState<string>('');
    const [subscribed, setSubscribed] = useState<boolean>(false);
    const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);
    const [isPlayingSound, setIsPlayingSound] = useState<boolean>(false);
    const [activeVolume, setActiveVolume] = useState<number>(75);

    useEffect(() => {
        const updateClocks = () => {
            const now = new Date();
            setCurrentTime(
                now.toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                }),
            );
            setCurrentUtc(
                now.toLocaleTimeString('en-GB', {
                    timeZone: 'UTC',
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                }),
            );
        };
        updateClocks();
        const interval = setInterval(updateClocks, 1000);
        return () => clearInterval(interval);
    }, []);

    const toggleTheme = () => {
        const next = appearance === 'dark' ? 'light' : 'dark';
        updateAppearance(next);
    };

    const handleCopyCommand = () => {
        navigator.clipboard?.writeText('npx create-talk-app@latest --minimal');
        setCopiedSnippet(true);
        setTimeout(() => setCopiedSnippet(false), 2000);
    };

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) {
            setSubscribed(true);
        }
    };

    const specModules = useMemo(
        () => [
            {
                id: '01',
                title: 'LINGUISTIC PRESERVATION',
                tag: 'ARCH-01',
                desc: 'sample.',
                metrics: 'sample',
                code: `sample
function composeView(signal, noise) {
  if (noise.isDecorative()) {
    noise.purge();
  }
  return signal.crystallize({ palette: 'monochrome' });
}`,
            },
            {
                id: '02',
                title: 'LINGUISTIC PRESERVATION',
                tag: 'ARCH-01',
                desc: 'sample.',
                metrics: 'sample',
                code: `sample
const baselineRhythm = {
  unit: 8, // px
  gutters: [16, 24, 32, 64],
  leading: (fontSize) => Math.round(fontSize * 1.5 / 8) * 8
};`,
            },
            {
                id: '03',
                title: 'LINGUISTIC PRESERVATION',
                tag: 'ARCH-01',
                desc: 'sample.',
                metrics: 'sample',
                code: `sample
export const telemetry = {
  contrastRatio: '21:1 (AAA Absolute)',
  colorDepth: '1-bit binary representation',
  frameBudget: '< 16.6ms per render'
};`,
            },
            {
               id: '04',
                title: 'LINGUISTIC PRESERVATION',
                tag: 'ARCH-01',
                desc: 'sample.',
                metrics: 'sample',
                code: `sample
const transitionCurve = {
  timing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  duration: '140ms',
  blur: 'none'
};`,
            },
        ],
        [],
    );

    return (
        <>
            <Head title="MerGoKan - Language Dictionary">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700|jetbrains-mono:400,500" rel="stylesheet" />
            </Head>

            <div
                className={`min-h-screen bg-white text-black transition-colors duration-200 selection:bg-black selection:text-white dark:bg-black dark:text-white dark:selection:bg-white dark:selection:text-black ${
                    gridOverlay
                        ? 'bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:40px_40px] dark:bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]'
                        : ''
                }`}
                style={{ fontFamily: "'Instrument Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}
            >
                {/* 1. TOP UTILITY TICKER */}
                <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2 font-mono text-[11px] tracking-wider text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
                    <div className="mx-auto flex max-w-7xl items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5 font-medium text-neutral-900 dark:text-neutral-200">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black opacity-75 dark:bg-white" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-black dark:bg-white" />
                                </span>
                                hehe translator
                            </span>
                            <span className="hidden text-neutral-300 sm:inline dark:text-neutral-700">/</span>
                            <span className="hidden sm:inline">Ibanag language preservation v1</span>
                            <span className="hidden text-neutral-300 md:inline dark:text-neutral-700">/</span>
                            <span className="hidden md:inline">Translator</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden items-center gap-3 lg:flex">
                                <span>UTC: {currentUtc || '00:00:00'}</span>
                                <span className="text-neutral-300 dark:text-neutral-700">|</span>
                                <span>LOCAL: {currentTime || '00:00:00'}</span>
                            </div>

                            <button
                                onClick={() => setGridOverlay(!gridOverlay)}
                                className="flex items-center gap-1.5 rounded border border-neutral-300 bg-white px-2 py-0.5 text-[10px] font-medium tracking-wider text-neutral-800 uppercase transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                title="Toggle drafting grid overlay"
                            >
                                <Grid3X3 className="h-3 w-3" />
                                <span>GRID {gridOverlay ? 'ON' : 'OFF'}</span>
                            </button>
                        </div>
                    </div>
                </div>
                <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur-md dark:border-neutral-800 dark:bg-black/90">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-6">
                            <Link href="/" className="group flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center border border-black bg-black text-white transition-transform group-hover:scale-95 dark:border-white dark:bg-white dark:text-black">
                                    <span className="font-mono text-sm font-black tracking-tighter">M</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-mono text-sm font-bold tracking-tight text-black uppercase dark:text-white">
                                        MergoKan
                                    </span>
                                    <span className="font-mono text-[9px] tracking-widest text-neutral-500 uppercase">DICTIONARY 2026</span>
                                </div>
                            </Link>

                            <nav className="hidden items-center gap-1 pl-6 md:flex">
                                {['Home', 'Principles', 'Blueprint', 'Archive'].map((item) => (
                                    <a
                                        key={item}
                                        href={`#${item.toLowerCase()}`}
                                        className="rounded-sm px-3 py-1.5 text-xs font-medium tracking-wide text-neutral-600 transition-colors hover:text-black dark:text-neutral-400 dark:hover:text-white"
                                    >
                                        {item}
                                    </a>
                                ))}
                            </nav>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2.5">
                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="flex h-8 w-8 items-center justify-center border border-neutral-300 transition-colors hover:border-black dark:border-neutral-700 dark:hover:border-white"
                                aria-label="Toggle monochrome mode"
                                title={`Switch to ${appearance === 'dark' ? 'light' : 'dark'} mode`}
                            >
                                {appearance === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                            </button>

                            {auth?.user ? (
                                <Link
                                    href={safeRoute('dashboard', '/dashboard')}
                                    className="flex h-8 items-center gap-1.5 border border-black bg-black px-3.5 font-mono text-xs font-medium text-white transition-colors hover:bg-neutral-800 dark:border-white dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                                >
                                    <span>CONSOLE</span>
                                    <ArrowRight className="h-3 w-3" />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={safeRoute('login', '/login')}
                                        className="hidden h-8 items-center border border-neutral-300 px-3 font-mono text-xs font-medium text-neutral-900 transition-colors hover:border-black sm:flex dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-white"
                                    >
                                        LOG IN
                                    </Link>
                                    <Link
                                        href={safeRoute('register', '/register')}
                                        className="flex h-8 items-center gap-1.5 border border-black bg-black px-3.5 font-mono text-xs font-medium text-white transition-colors hover:bg-neutral-800 dark:border-white dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                                    >
                                        <span>GET ACCESS</span>
                                        <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <section className="relative border-b border-neutral-200 px-4 py-20 sm:px-6 lg:px-8 lg:py-28 dark:border-neutral-800">
                    <div className="pointer-events-none absolute top-4 left-4 font-mono text-xs text-neutral-400 select-none dark:text-neutral-600">
                        +
                    </div>
                    <div className="pointer-events-none absolute top-4 right-4 font-mono text-xs text-neutral-400 select-none dark:text-neutral-600">
                        +
                    </div>
                    <div className="pointer-events-none absolute bottom-4 left-4 font-mono text-xs text-neutral-400 select-none dark:text-neutral-600">
                        +
                    </div>
                    <div className="pointer-events-none absolute right-4 bottom-4 font-mono text-xs text-neutral-400 select-none dark:text-neutral-600">
                        +
                    </div>

                    <div className="mx-auto max-w-5xl">

             <div className="mb-6 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 border border-neutral-300 bg-neutral-100 px-2.5 py-1 font-mono text-[10px] tracking-widest text-neutral-800 uppercase dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                                <Square className="h-2 w-2 fill-current" />
                                Sample homepage ko for the translator for ibanag language preservation
                            </span>
                            <span className="font-mono text-xs text-neutral-400 dark:text-neutral-600">[ Date started   : November 01, 2026 ]</span>
                        </div>

                        <h1 className="mb-8 text-4xl font-normal tracking-tight text-neutral-950 sm:text-6xl md:text-7xl lg:leading-[1.08] dark:text-white">
                            MerGoKan <br />
                            <span className="font-semibold italic underline decoration-1 underline-offset-8">Language Preservation</span>
                        </h1>

            
                        <p className="mb-10 max-w-2xl text-base leading-relaxed text-neutral-600 sm:text-lg dark:text-neutral-400">
                           Preserve Ibanag, Ilocano, and Itawit language, free to learn using your free time.
                        </p>

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <a
                                href="#blueprint"
                                className="group inline-flex h-12 items-center justify-center gap-2 border border-black bg-black px-6 font-mono text-xs font-semibold tracking-wider text-white uppercase transition-all hover:bg-neutral-800 hover:shadow-lg dark:border-white dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                            >
                                <span>EXPLORE THE SYSTEM</span>
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </a>

                            <a
                                href="#principles"
                                className="inline-flex h-12 items-center justify-center gap-2 border border-neutral-300 bg-transparent px-6 font-mono text-xs font-medium tracking-wider text-black uppercase transition-colors hover:border-black hover:bg-neutral-100 dark:border-neutral-700 dark:text-white dark:hover:border-white dark:hover:bg-neutral-900"
                            >
                                <span>READ guideline</span>
                                <ArrowUpRight className="h-4 w-4" />
                            </a>

                            <div className="flex h-12 items-center border border-neutral-200 bg-neutral-50 px-3 font-mono text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
                                <span className="mr-2 text-neutral-400 select-none">$</span>
                                {/* <span className="truncate">npx create-talk@latest</span> */}
                                <span className="truncate">hehe kapag tapos na pwede niyo install sa desktop or mobile niyo</span>
                                <button
                                    onClick={handleCopyCommand}
                                    className="ml-3 flex h-7 items-center gap-1 border border-neutral-300 bg-white px-2 text-[10px] uppercase transition hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                                    title="Copy to clipboard"
                                >
                                    {copiedSnippet ? (
                                        <>
                                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                            <span>COPIED</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3 w-3" />
                                            <span>COPY</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div
                            id="blueprint"
                            className="mt-16 border border-neutral-200 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-950/50"
                        >
                            <div className="flex flex-wrap items-center justify-between border-b border-neutral-200 bg-white px-4 py-2.5 dark:border-neutral-800 dark:bg-black">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="h-2.5 w-2.5 rounded-full border border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900" />
                                        <div className="h-2.5 w-2.5 rounded-full border border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900" />
                                        <div className="h-2.5 w-2.5 rounded-full border border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900" />
                                    </div>
                                    <span className="font-mono text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                        ibanag_workspace.tsx
                                    </span>
                                </div>

                                <div className="flex items-center gap-1 font-mono text-[11px]">
                                    {(['blueprint', 'sample', 'typography', 'guide'] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-3 py-1 tracking-wider uppercase transition-colors ${
                                                activeTab === tab
                                                    ? 'border border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                                                    : 'text-neutral-500 hover:text-black dark:hover:text-white'
                                            }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 md:p-8">
                                {activeTab === 'blueprint' && (
                                    <div className="space-y-6">
                                        <div className="flex flex-wrap items-center justify-between border-b border-neutral-200 pb-4 font-mono text-xs dark:border-neutral-800">
                                            <div>
                                                <span className="text-neutral-400">ACTIVE SCHEMATIC: </span>
                                                <span className="font-semibold text-neutral-900 dark:text-white">Layout</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-neutral-500">
                                                <span>SCALE: 1:1</span>
                                                <span>GRID: 8PX</span>
                                                <span className="text-black dark:text-white">CONTRAST: 100%</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                            <div className="border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-black">
                                                <div className="mb-3 flex items-center justify-between border-b border-neutral-100 pb-2 dark:border-neutral-900">
                                                    <span className="font-mono text-[10px] text-neutral-400 uppercase">TREE VIEW</span>
                                                    <span className="font-mono text-[10px] text-neutral-400">4 NODES</span>
                                                </div>
                                                <div className="space-y-2 font-mono text-xs">
                                                    {['/ root', '├── manifesto.md', '├── architecture.sys', '└── index.tsx'].map((line, i) => (
                                                        <div
                                                            key={i}
                                                            className={`cursor-pointer px-2 py-1.5 transition-colors ${
                                                                i === 0
                                                                    ? 'bg-neutral-100 font-medium text-black dark:bg-neutral-900 dark:text-white'
                                                                    : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-900/50'
                                                            }`}
                                                        >
                                                            {line}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Column 2: Interactive Wireframe Card */}
                                            <div className="border border-black bg-white p-4 lg:col-span-2 dark:border-white dark:bg-black">
                                                <div className="mb-4 flex items-center justify-between border-b border-neutral-200 pb-2 dark:border-neutral-800">
                                                    <span className="font-mono text-[10px] font-bold tracking-wider text-black uppercase dark:text-white">
                                                        TRANSLATION ENGINE // READY
                                                    </span>
                                                    <span className="font-mono text-[10px] text-neutral-500">STATUS: 200 OK</span>
                                                </div>

                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <label className="font-mono text-[11px] text-neutral-500 uppercase">
                                                            	TRANSLATION INPUT
                                                        </label>
                                                        <div className="flex border border-neutral-300 dark:border-neutral-700">
                                                            <input
                                                                type="text"
                                                                readOnly
                                                                value="ENTER_YBANAG_WORD_OR_PHRASE"
                                                                className="w-full bg-transparent px-3 py-1.5 font-mono text-xs text-neutral-900 focus:outline-none dark:text-neutral-100"
                                                            />
                                                            <span className="flex items-center px-2 text-neutral-400">
                                                                <CornerDownLeft className="h-3 w-3" />
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="font-mono text-[11px] text-neutral-500 uppercase">TRANSLATION CONTROLS</label>
                                                        <div className="flex gap-2">
                                                            <button className="flex-1 border border-black bg-black py-1.5 font-mono text-[11px] font-semibold text-white uppercase dark:border-white dark:bg-white dark:text-black">
                                                               Translate
                                                            </button>
                                                            <button className="flex-1 border border-neutral-300 bg-transparent py-1.5 font-mono text-[11px] text-black uppercase transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-900">
                                                                Clear
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 border-t border-neutral-100 pt-3 font-mono text-[11px] text-neutral-500 dark:border-neutral-900">
                                                    <span className="text-black dark:text-white">METRIC:</span>Awaiting translation request
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* {activeTab === 'telemetry' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4 font-mono sm:grid-cols-4">
                                            {[
                                                { label: 'HEAP ALLOCATED', val: '12.4 MB', delta: '-82% vs standard' },
                                                { label: 'SIGNAL PURITY', val: '99.98%', delta: 'Deterministic' },
                                                { label: 'RENDER FRAME', val: '16.4ms', delta: '60 FPS locked' },
                                                { label: 'BUNDLE IMPACT', val: '4.2 KB', delta: 'Zero bloat' },
                                            ].map((stat, i) => (
                                                <div key={i} className="border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-black">
                                                    <div className="text-[10px] text-neutral-400 uppercase">{stat.label}</div>
                                                    <div className="text-xl font-bold text-black dark:text-white">{stat.val}</div>
                                                    <div className="text-[10px] text-neutral-500">{stat.delta}</div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="border border-neutral-200 bg-white p-4 font-mono text-xs dark:border-neutral-800 dark:bg-black">
                                            <div className="mb-2 flex items-center justify-between text-neutral-400">
                                                <span>LIVE SIGNAL TELEMETRY WAVEFORM</span>
                                                <span>SAMPLING: 1000 HZ</span>
                                            </div>
                                            <div className="flex h-16 items-end gap-1 overflow-hidden border-b border-neutral-200 pb-1 dark:border-neutral-800">
                                                {[
                                                    15, 30, 45, 60, 20, 80, 95, 40, 55, 70, 35, 90, 65, 30, 85, 40, 60, 25, 95, 75, 50, 30, 80, 60,
                                                    90, 45, 70, 35, 80, 50, 65, 90, 40, 75, 55, 30, 85, 45, 60, 20, 95, 70, 40, 85, 60, 30, 75, 90,
                                                ].map((h, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-full bg-black transition-all duration-300 dark:bg-white"
                                                        style={{ height: `${h}%` }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )} */}

                                {activeTab === 'typography' && (
                                    <div className="space-y-6">
                                        <div className="border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-black">
                                            <div className="mb-2 font-mono text-[10px] text-neutral-400 uppercase">SPEC // DISPLAY 48PX</div>
                                            <p className="text-3xl font-medium tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
                                                The quick brown fox jumps over the lazy dog.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-black">
                                                <div className="mb-2 font-mono text-[10px] text-neutral-400 uppercase">SPEC // MONOSPACE 13PX</div>
                                                <p className="font-mono text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                                                    ABCDEFGHIJKLMNOPQRSTUVWXYZ
                                                    <br />
                                                    abcdefghijklmnopqrstuvwxyz
                                                    <br />
                                                    0123456789 () [] {} &lt;&gt; = + - * /
                                                </p>
                                            </div>

                                            <div className="border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-black">
                                                <div className="mb-2 font-mono text-[10px] text-neutral-400 uppercase">
                                                    SPEC // EDITORIAL BODY 14PX
                                                </div>
                                                <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                                                    Clarity does not emerge by chance; it is the deliberate residue of disciplined subtraction. Every
                                                    glyph is optimized for rapid optical parsing.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* {activeTab === 'manifesto' && (
                                    <div className="border border-neutral-200 bg-white p-6 font-mono text-xs leading-relaxed dark:border-neutral-800 dark:bg-black">
                                        <p className="mb-4 text-sm font-semibold text-black dark:text-white">// THE MONOCHROME THESIS (2026)</p>
                                        <p className="mb-3 text-neutral-700 dark:text-neutral-300">
                                            1. Color often acts as a narcotic to mask weak structure. When you take away color, geometry and
                                            typography have nowhere to hide.
                                        </p>
                                        <p className="mb-3 text-neutral-700 dark:text-neutral-300">
                                            2. A black-and-white interface never goes out of fashion. It was timeless in 1920 Bauhaus, timeless in
                                            1960 Braun, and timeless in modern computing.
                                        </p>
                                        <p className="text-neutral-700 dark:text-neutral-300">
                                            3. The user's focus belongs to their thoughts, their code, and their data — never to the vessel that
                                            carries it.
                                        </p>
                                    </div>
                                )} */}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-black">
                    <div className="mx-auto grid max-w-7xl grid-cols-2 divide-y divide-neutral-200 border-x border-neutral-200 sm:grid-cols-4 sm:divide-x sm:divide-y-0 dark:divide-neutral-800 dark:border-neutral-800">
                        {[
                            { value: 'AI', label: 'INTELLIGENT TRANSLATION', note: 'Context-aware language assistance' },
                            { value: '3+', label: 'SUPPORTED LANGUAGES', note: 'Ybanag, Itawit, and Ilocano(pero ibanag muna)' },
                            { value: '24/7', label: 'LANGUAGE ACCESSIBILITY', note: 'Explore local languages anytime' },
                            { value: '∞', label: 'CULTURAL PRESERVATION', note: 'Keeping local languages alive for future generations' },
                        ].map((metric, i) => (
                            <div key={i} className="group p-6 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-950">
                                <div className="font-mono text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
                                    {metric.value}
                                </div>
                                <div className="mt-1 font-mono text-xs font-semibold tracking-wider text-neutral-800 uppercase dark:text-neutral-200">
                                    {metric.label}
                                </div>
                                <div className="mt-1 font-mono text-[11px] text-neutral-500">{metric.note}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5. DESIGN PRINCIPLES (ARCHITECTURAL 4-GRID) */}
                <section id="principles" className="border-b border-neutral-200 px-4 py-20 sm:px-6 lg:px-8 dark:border-neutral-800">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                            <div>
                                <span className="font-mono text-xs font-semibold tracking-widest text-neutral-500 uppercase">
                                    [ SECTION 02 ] // CORE TENETS
                                </span>
                                <h2 className="mt-2 text-3xl font-medium tracking-tight text-black sm:text-4xl dark:text-white">
                                    Architectural Pillars
                                </h2>
                            </div>
                            <p className="max-w-md font-mono text-xs text-neutral-500">
                                Grounded in the enduring ethos of Swiss typography and Dieter Rams' functionalism.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                            {specModules.map((item, index) => (
                                <div
                                    key={item.id}
                                    onClick={() => setActiveSpecIndex(index)}
                                    className={`relative cursor-pointer border p-6 transition-all ${
                                        activeSpecIndex === index
                                            ? 'border-black bg-neutral-50 shadow-md dark:border-white dark:bg-neutral-900'
                                            : 'border-neutral-200 bg-white hover:border-neutral-400 dark:border-neutral-800 dark:bg-black dark:hover:border-neutral-600'
                                    }`}
                                >
                                    {/* Corner tick */}
                                    <div className="absolute top-3 right-3 font-mono text-[10px] text-neutral-400">[{item.tag}]</div>

                                    <div className="mb-4 font-mono text-sm font-bold text-neutral-400">{item.id}</div>
                                    <h3 className="mb-2 text-lg font-bold tracking-tight text-black dark:text-white">{item.title}</h3>
                                    <p className="mb-4 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">{item.desc}</p>
                                    <div className="border-t border-neutral-200 pt-3 font-mono text-[10px] text-neutral-500 dark:border-neutral-800">
                                        {item.metrics}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* <div className="mt-8 border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-black">
                            <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-2 font-mono text-xs dark:border-neutral-800 dark:bg-neutral-950">
                                <div className="flex items-center gap-2">
                                    <Terminal className="h-3.5 w-3.5 text-neutral-500" />
                                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                        SPECIFICATION // {specModules[activeSpecIndex].title}
                                    </span>
                                </div>
                                <span className="text-[10px] text-neutral-500">MODULE {specModules[activeSpecIndex].id} / 04</span>
                            </div>
                            <pre className="overflow-x-auto p-4 font-mono text-xs text-neutral-800 dark:text-neutral-200">
                                <code>{specModules[activeSpecIndex].code}</code>
                            </pre>
                        </div> */}
                    </div>
                </section>



                <section id="archive" className="border-b border-neutral-200 px-4 py-20 sm:px-6 lg:px-8 dark:border-neutral-800">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                            <div>
                                <span className="font-mono text-xs font-semibold tracking-widest text-neutral-500 uppercase">
                                    [ SECTION 03 ]
                                </span>
                                <h2 className="mt-2 text-3xl font-medium tracking-tight text-black sm:text-4xl dark:text-white">
                                    Curated System Archive
                                </h2>
                            </div>
                            <span className="font-mono text-xs text-neutral-500">INDEXED CHRONOLOGICALLY</span>
                        </div>

                        <div className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
                            {[
                                {
                                    year: '2026',
                                    title: 'Ybanag Translation Engine',
                                    category: 'Core Module',
                                    spec: 'AI-assisted multilingual translation and contextual interpretation',
                                    status: 'IN DEVELOPMENT',
                                },
                                {
                                    year: '2026',
                                    title: 'Multilingual Dictionary Database',
                                    category: 'Data Architecture',
                                    spec: 'Ybanag vocabulary and verified definitions',
                                    status: 'IN DEVELOPMENT',
                                },
                                {
                                    year: '2026',
                                    title: 'Geolinguistic Mapping System',
                                    category: 'Cultural Documentation',
                                    spec: 'Geographic language origins and community-based vocabulary records',
                                    status: 'PLANNED',
                                },
                            ].map((work, idx) => (
                                <div
                                    key={idx}
                                    className="group flex flex-col justify-between gap-4 py-6 transition-colors hover:bg-neutral-50 sm:flex-row sm:items-center sm:px-4 dark:hover:bg-neutral-950"
                                >
                                    <div className="flex items-start gap-6 sm:items-center">
                                        <span className="font-mono text-xs text-neutral-400">{work.year}</span>
                                        <div>
                                            <h4 className="text-xl font-bold tracking-tight text-black group-hover:underline dark:text-white">
                                                {work.title}
                                            </h4>
                                            <div className="mt-1 flex items-center gap-3 font-mono text-xs text-neutral-500">
                                                <span>{work.category}</span>
                                                <span>·</span>
                                                <span>{work.spec}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 sm:justify-end">
                                        <span className="border border-neutral-300 px-2 py-0.5 font-mono text-[10px] tracking-wider text-neutral-700 uppercase dark:border-neutral-700 dark:text-neutral-300">
                                            {work.status}
                                        </span>
                                        <ArrowUpRight className="h-5 w-5 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-black dark:group-hover:text-white" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="border-b border-neutral-200 px-4 py-24 sm:px-6 lg:px-8 dark:border-neutral-800">
                    <div className="mx-auto max-w-4xl text-center">
                        <span className="font-mono text-4xl font-light text-neutral-300 select-none sm:text-6xl dark:text-neutral-700">“</span>
                        <blockquote className="text-2xl leading-snug font-light tracking-tight text-neutral-900 sm:text-3xl md:text-4xl dark:text-neutral-100">
                           Maddulo kamu HAHAHHAHAHAHA
                        </blockquote>
                        <div className="mt-6 flex items-center justify-center gap-2 font-mono text-xs tracking-widest text-neutral-500 uppercase">
                            <span>-ian</span>
                            <span>—</span>
                            <span></span>
                        </div>
                    </div>
                </section>

                <section className="border-b border-neutral-200 bg-neutral-50 px-4 py-20 sm:px-6 lg:px-8 dark:border-neutral-800 dark:bg-neutral-950">
                    <div className="mx-auto max-w-2xl border border-black bg-white p-8 text-center sm:p-12 dark:border-white dark:bg-black">
                        <span className="font-mono text-xs font-semibold tracking-widest text-neutral-400 uppercase">[ CONNECT // CONTRIBUTE ]</span>
                        <h3 className="mt-3 text-3xl font-bold tracking-tight text-black sm:text-4xl dark:text-white">
                            Help preserve our languages
                        </h3>
                        <p className="mx-auto mt-3 max-w-md text-sm text-neutral-600 dark:text-neutral-400">
                            Be part of a growing community dedicated to documenting, sharing, and preserving Ybanag, Itawit, and Ilocano. Contribute words, meanings, translations, and cultural knowledge.
                        </p>

                        {subscribed ? (
                            <div className="mt-8 border border-black bg-neutral-100 p-4 font-mono text-xs text-black dark:border-white dark:bg-neutral-900 dark:text-white">
                                <span className="font-bold">TRANSMISSION CONFIRMED.</span> CULTURE-FOCUSED · LANGUAGE PRESERVATION
                            </div>
                        ) : (
                            <form onSubmit={handleSubscribe} className="mt-8 flex flex-col gap-2 sm:flex-row">
                                <input
                                    type="email"
                                    required
                                    placeholder="engineer@domain.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex-1 border border-neutral-300 bg-transparent px-4 py-3 font-mono text-xs text-black placeholder:text-neutral-400 focus:border-black focus:outline-none dark:border-neutral-700 dark:text-white dark:focus:border-white"
                                />
                                <button
                                    type="submit"
                                    className="border border-black bg-black px-6 py-3 font-mono text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-neutral-800 dark:border-white dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                                >
                                    SUBSCRIBE
                                </button>
                            </form>
                        )}

                        <div className="mt-4 font-mono text-[10px] text-neutral-400">ENCRYPTED TRANSMISSION · 100% PRIVATE</div>
                    </div>
                </section>

                
            </div>
        </>
    );
}
