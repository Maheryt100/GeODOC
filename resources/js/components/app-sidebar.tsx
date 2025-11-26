import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Folder,
    Folders,
    Coins,
    LayoutGrid,
    Settings,
    UserCog,
    Activity,
    BarChart3
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
            title: 'Statistiques', // ✅ REMPLACE "Consorts"
            href: '/statistiques',
            icon: BarChart3,
        },
    ];

    // ============ CONFIGURATION (Admin uniquement) ============
    const configNavItems: NavItem[] = [];

    // Prix du terrain - accessible aux super_admin et admin_district
    if (user && (user.role === 'super_admin' || user.role === 'admin_district')) {
        configNavItems.push({
            title: 'Prix du terrain',
            href: '/circonscription',
            icon: Coins,
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
            </SidebarHeader>

            <SidebarContent>
                {/* Navigation principale */}
                <NavMain items={mainNavItems} />
                
                {/* Section Configuration (si items disponibles) */}
                {configNavItems.length > 0 && (
                    <div className="mt-4">
                        <div className="px-3 py-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                <Settings className="h-3 w-3" />
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