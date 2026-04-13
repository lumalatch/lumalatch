import { useEffect } from 'react';

export function useScrollGrace(
  activePanel: string | null,
  onClose: () => void
) {
  useEffect(() => {
    if (!activePanel) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePanel, onClose]);
}
