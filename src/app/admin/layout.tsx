
import * as React from 'react';

// This layout is a pass-through to ensure the route is created,
// while page-specific logic is handled on the page itself.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
