import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VRSOC — Cyber Defense Training",
  description: "Enterprise SOC Training & Simulation SaaS Platform. Learn • Detect • Investigate • Defend.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%235B0A0A'/><text x='50' y='65' font-size='45' fill='white' text-anchor='middle' font-family='Arial' font-weight='bold'>VS</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0A0A0A] text-white antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
