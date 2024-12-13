import { useUserSetting } from '@/layout/hooks/useUserSetting';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useBreakpoint } from './useBreakpoint';

export function useSidebarCloseOnPathnameOnMobile() {
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  const { setUserSetting } = useUserSetting();

  const isLgDown = useBreakpoint('lgDown');

  const closeSidebarOnMobile = useCallback(() => {
    if (isLgDown) {
      setUserSetting('sidebarPinned', false);
    }
  }, [isLgDown, setUserSetting]);

  useEffect(() => {
    if (pathname !== lastPathname) {
      closeSidebarOnMobile();

      setLastPathname(pathname);
    }
  }, [pathname, lastPathname, closeSidebarOnMobile]);
}
