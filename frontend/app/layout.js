import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider } from '@/context/AuthContext';
import NavBar from '@/components/NavBar';

export const metadata = {
  title: 'Finance Manager',
  description: 'Personal finance manager — accounts, income, expenses and a dashboard with charts.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NavBar />
          <main className="container py-4">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
