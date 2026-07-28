// Login page uses the root layout but bypasses the admin layout
// This metadata ensures the page doesn't show the admin sidebar
export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
