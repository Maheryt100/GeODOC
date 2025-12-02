// Statistics/components/PlaceholderTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    title: string;
}

export function PlaceholderTab({ title }: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Contenu à implémenter...</p>
            </CardContent>
        </Card>
    );
}