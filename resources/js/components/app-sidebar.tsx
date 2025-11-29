import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Folder,
    Folders,
    MapPin,
    LayoutGrid,
    Settings,
    UserCog,
    Activity,
    BarChart3,
    Shield
} from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    // ============ NAVIGATION PRINCIPALE ============
    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
        },
        {
            title: 'Dossiers',
            href: '/dossiers',
            icon: Folders,
        },
        {
            title: 'Statistiques',
            href: '/statistiques',
            icon: BarChart3,
        },
    ];

    // ============ CONFIGURATION (Admin uniquement) ============
    const configNavItems: NavItem[] = [];

    // Gestion des localisations - accessible aux super_admin et admin_district
    if (user && (user.role === 'super_admin' || user.role === 'admin_district')) {
        configNavItems.push({
            title: 'Localisations',
            href: '/location',
            icon: MapPin,
        });
        
        // Logs d'activité
        configNavItems.push({
            title: 'Logs d\'activité',
            href: '/admin/activity-logs',
            icon: Activity,
        });
    }

    // Gestion des utilisateurs - super_admin seulement
    if (user && user.role === 'super_admin') {
        configNavItems.push({
            title: 'Utilisateurs',
            href: '/users',
            icon: UserCog,
        });
    }

    // ============ FOOTER (Documentation) ============
    const footerNavItems: NavItem[] = [
        {
            title: 'Repository',
            href: 'https://github.com/laravel/react-starter-kit',
            icon: Folder,
        },
        {
            title: 'Documentation',
            href: 'https://laravel.com/docs/starter-kits#react',
            icon: BookOpen,
        },
    ];

    // Déterminer le badge de rôle
    const getRoleBadge = () => {
        if (!user) return null;
        
        const roleConfig = {
            super_admin: { label: 'Super Admin', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20' },
            admin_district: { label: 'Admin District', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20' },
            user: { label: 'Utilisateur', color: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20' },
        };

        const config = roleConfig[user.role as keyof typeof roleConfig];
        if (!config) return null;

        return (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${config.color}`}>
                <Shield className="h-3 w-3" />
                {config.label}
            </div>
        );
    };

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                
                {/* Badge de rôle sous le logo */}
                <div className="px-3 pt-2 pb-1 group-data-[collapsible=icon]:hidden">
                    {getRoleBadge()}
                </div>
            </SidebarHeader>

            <SidebarContent>
                {/* Navigation principale */}
                <div className="px-3 py-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Menu Principal
                    </div>
                </div>
                <NavMain items={mainNavItems} />
                
                {/* Séparateur si items de configuration */}
                {configNavItems.length > 0 && (
                    <div className="px-3 py-3">
                        <Separator />
                    </div>
                )}
                
                {/* Section Configuration (si items disponibles) */}
                {configNavItems.length > 0 && (
                    <div>
                        <div className="px-3 py-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                <Settings className="h-3.5 w-3.5" />
                                Configuration
                            </div>
                        </div>
                        <NavMain items={configNavItems} />
                    </div>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}