import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="bg-black text-white transition-transform group-hover:scale-95 dark:border-white dark:bg-white dark:text-black flex aspect-square size-8 items-center justify-center rounded-md">
                 <span className="font-mono text-sm font-black tracking-tighter">M</span>
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-none font-semibold">MergoKan</span>
            </div>
        </>
    );
}

