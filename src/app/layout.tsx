import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { AuditProvider } from "@/context/AuditContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "موزون | مقياس أمانة النقل",
  description:
    "يقيس موزون أمانة نقل المعنى بين نص شرعي أصلي ونص مشتق منه: طبقة حتمية، وطبقة معجمية، وطبقة دلالية، وحكم واحد بثلاث حالات مع سجل قابل لإعادة التشغيل.",
};

export default function RootLayout(props: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${plexArabic.variable} h-full antialiased`}
    >
      <head>
        {/*
          Material Symbols is an icon font, so it is not available through
          next/font and has to be loaded with a plain stylesheet link.
        */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
        {/*
          Theme bootstrap: read the stored choice (or the OS preference) before
          first paint so the hero and workspace never flash the wrong theme.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("mawzun_theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <LanguageProvider>
            <AuditProvider>
              <AppShell>{props.children}</AppShell>
            </AuditProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}