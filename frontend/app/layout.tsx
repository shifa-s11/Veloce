import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/ThemeProvider.js";
import { AuthBarrier } from "@/components/shared/AuthBarrier.js";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Veloce — Premium Task Manager",
  description: "A production-grade, full-stack task management application designed for speed and productivity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthBarrier>
            {children}
            <Toaster richColors position="bottom-right" />
          </AuthBarrier>
        </ThemeProvider>
      </body>
    </html>
  );
}
