import './globals.css';

export const metadata = {
  title: 'Woodpecker — AI Business Architect',
  description: 'You ideate, we do the thing.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}