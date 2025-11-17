import type { route as routeFn } from 'ziggy-js';
import { route as ziggyRoute } from 'ziggy-js';


declare global {
    const route: typeof routeFn;
    interface Window {
        route: typeof ziggyRoute;
    }
    
    var route: typeof ziggyRoute;
}

export {};