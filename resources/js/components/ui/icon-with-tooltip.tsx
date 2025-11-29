// components/ui/icon-with-tooltip.tsx
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function IconWithTooltip({ 
    Icon, 
    label, 
    className = "" 
}: { 
    Icon: React.ComponentType<{ className: string }>;
    label: string;
    className?: string;
}) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Icon className={className} />
                </TooltipTrigger>
                <TooltipContent>
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}