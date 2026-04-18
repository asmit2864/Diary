import { useEffect, useRef } from 'react';

export function useHardwareBack(onBack) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    let pushed = false;
    
    const handler = async (e) => {
      // The user pressed the hardware back button, popping the dummy state
      const closed = await onBackRef.current();
      
      // If the component refused to close (e.g. an active upload), it returns false explicitly.
      // We must immediately re-trap the back button to prevent the NEXT back press from exiting the app!
      if (closed === false && pushed) {
        window.history.pushState({ modal: 'open' }, '');
      }
    };

    // Delay the trap by 50ms to completely bypass React 18 Strict Mode's ghost mounting phase!
    // Strict Mode instantly mounts & unmounts components in under 5ms during development.
    // Without this delay, the ghost unmount triggers history.back() which destroys the real mount's state!
    const pushTimer = setTimeout(() => {
      window.history.pushState({ modal: 'open' }, '');
      window.addEventListener('popstate', handler);
      pushed = true;
    }, 50);
    
    return () => {
      clearTimeout(pushTimer);
      if (pushed) {
        window.removeEventListener('popstate', handler);
        
        // If the component unmounts via standard UI (e.g. 'X' button or overlay),
        // we manually pop the trap to prevent frustrating the user later.
        if (window.history.state?.modal === 'open') {
          window.history.back();
        }
      }
    };
  }, []);
}
