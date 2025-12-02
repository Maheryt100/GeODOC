// Statistics/components/StatCard.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    icon: LucideIcon;
    title: string;
    value: string;
    subtitle?: string;
    trend?: number;
    color?: 'blue' | 'green' | 'purple' | 'orange';
}

export function StatCard({ 
    icon: Icon, 
    title, 
    value, 
    subtitle, 
    trend, 
    color = 'blue' 
}: StatCardProps) {
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div className={cn(
                        "p-3 rounded-lg",
                        color === 'blue' && "bg-blue-100 dark:bg-blue-900",
                        color === 'green' && "bg-green-100 dark:bg-green-900",
                        color === 'purple' && "bg-purple-100 dark:bg-purple-900",
                        color === 'orange' && "bg-orange-100 dark:bg-orange-900"
                    )}>
                        <Icon className={cn(
                            "h-6 w-6",
                            color === 'blue' && "text-blue-600 dark:text-blue-400",
                            color === 'green' && "text-green-600 dark:text-green-400",
                            color === 'purple' && "text-purple-600 dark:text-purple-400",
                            color === 'orange' && "text-orange-600 dark:text-orange-400"
                        )} />
                    </div>
                    {trend !== undefined && (
                        <Badge variant={trend > 0 ? "default" : "secondary"} className="text-xs">
                            {trend > 0 ? '+' : ''}{trend}%
                        </Badge>
                    )}
                </div>
                <div className="mt-4">
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}