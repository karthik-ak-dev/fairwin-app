import { Sidebar } from './_components/Sidebar';
import '../styles/admin.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main className="main">{children}</main>
    </div>
  );
}
