// users/components/StatsCards.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, UserCog, Globe } from 'lucide-react';
import { UserStats } from '../types';
import { calculateActivePercentage } from '../helpers';

interface StatsCardsProps {
    stats: UserStats;
}

export const StatsCards = ({ stats }: StatsCardsProps) => {
    const activePercentage = calculateActivePercentage(stats.active, stats.total);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {stats.active} actifs ({activePercentage}%)
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div
                            className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${activePercentage}%` }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Super Admins */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
                    <Shield className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.super_admins}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Accès complet
                    </p>
                </CardContent>
            </Card>

            {/* Utilisateurs Centraux */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Users Centraux</CardTitle>
                    <Globe className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.central_users}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Tous les districts
                    </p>
                </CardContent>
            </Card>

            {/* Districts */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Utilisateurs District</CardTitle>
                    <UserCog className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.admin_district + stats.user_district}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {stats.admin_district} admins · {stats.user_district} users
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};