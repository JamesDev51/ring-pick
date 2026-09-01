import type { ReactNode } from 'react';

export function MobileShell({ children }: { children: ReactNode }) {
  return <main className="mobile-shell">{children}</main>;
}
