import { useSidebar } from '@/components/ui/sidebar';
import AppLogoIcon from './app-logo-icon';
import AppLogoTxtIcon from './app-logo-txt-icon';

export default function AppLogo() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <div className="flex items-center gap-0 text-black dark:text-white">

      
      <AppLogoIcon 
        className={`transition-all duration-200  ${
          isCollapsed ? 'w-8 h-8' : 'w-12 h-12'
        }`} 
      />

      <AppLogoTxtIcon 
        className={`h-auto transition-all duration-200 -translate-y-1 -translate-x-[-10px] ${
        isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-28'
        }`}
      />

      
    
    </div>
  );
}