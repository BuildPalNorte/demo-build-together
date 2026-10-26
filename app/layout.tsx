import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Build Together · Tec de Matamoros",
  description: "El talento existe. Solo falta conectarlo.",
  keywords: ["Build Pa'l Norte", 'Tec de Matamoros', 'Ingeniería', 'Taller'],
  authors: [{ name: "Build Pa'l Norte" }],
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#e4e4ea' },
    { media: '(prefers-color-scheme: dark)', color: '#07070c' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-background text-foreground">{children}</body>
    </html>
  );
}
