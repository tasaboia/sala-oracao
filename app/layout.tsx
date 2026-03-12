export const metadata = {
    title: "Líderes relógio de oração | Líderes sala de oração",
    description: "VDS'26",
  };
  
  import "./globals.css";
  
  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <html lang="pt-BR">
        <body>{children}</body>
      </html>
    );
  }