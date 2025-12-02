// Dashboard/components/AlertsSection.tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import type { Alert as AlertType } from '../types';

interface Props {
    alerts: AlertType[];
}

export function AlertsSection({ alerts }: Props) {
    if (!alerts || alerts.length === 0) {
        return null;
    }

    return (
        <div className="grid gap-3">
            {alerts.slice(0, 3).map((alert, index) => (
                <Alert 
                    key={index}
                    variant={alert.type === 'error' ? 'destructive' : 'default'}
                    className={cn(
                        alert.type === 'warning' && 'border-orange-500 bg-orange-50 dark:bg-orange-950/20',
                        alert.type === 'info' && 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                    )}
                >
                    {alert.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
                    {alert.type === 'info' && <Info className="h-4 w-4" />}
                    <AlertTitle>{alert.title}</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                        <span>{alert.message}</span>
                        {alert.action && (
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={alert.action}>
                                    Voir <ArrowRight className="ml-2 h-3 w-3" />
                                </Link>
                            </Button>
                        )}
                    </AlertDescription>
                </Alert>
            ))}
        </div>
    );
}