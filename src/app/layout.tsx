import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Atkinson_Hyperlegible_Mono, Atkinson_Hyperlegible_Next, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const atkinson = Atkinson_Hyperlegible_Next({ variable: "--font-atkinson", subsets: ["latin"] });
const atkinsonMono = Atkinson_Hyperlegible_Mono({ variable: "--font-atkinson-mono", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Railodex", template: "%s · Railodex" },
  description: "Cataloga tu colección de modelismo ferroviario: locomotoras, coches y vagones.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = (await cookies()).get("theme")?.value === "claro" ? "claro" : "oscuro";
  return (
    <html
      lang="es"
      data-theme={theme}
      className={`${atkinson.variable} ${atkinsonMono.variable} ${bricolage.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
