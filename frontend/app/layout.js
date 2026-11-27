import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider } from '@/context/AuthContext';
import NavBar from '@/components/NavBar';

export const metadata = {
  title: 'Gestor de Finanças',
  description: 'Projeto Final - Programação Web',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt">
      <body>
        <AuthProvider>
          <NavBar />
          <main className="container py-4">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}