import AppLogoIcon from '@/components/app-logo-icon';
import AppLogoTxtIcon from '@/components/app-logo-txt-icon';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        
                        <Link href={route('home')} className="flex flex-col items-center gap-2 font-medium">

                            {/* Bloc logo + texte */}
                            <div className="flex flex-col items-center gap-1">
                                
                                {/* Logo (agrandi) */}
                                <AppLogoIcon className="w-20 h-20 text-[var(--foreground)] dark:text-white" />

                                {/* Texte du logo */}
                                <AppLogoTxtIcon className="w-70 h-auto ml-[70px] text-[var(--foreground)] dark:text-white" />
                            </div>

                            <span className="sr-only">{title}</span>
                        </Link>

                        {/* Titre + description */}
                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-center text-sm text-muted-foreground">{description}</p>
                        </div>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
