import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { AuthBarrier } from "@/components/shared/AuthBarrier";
import { Toaster } from "sonner";

const outfit = Outfit({ subsets: ["latin"] });

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
      <body className={outfit.className}>
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
