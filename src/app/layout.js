import { Footer, HeaderServer } from "@/components";
import "./globals.css";
import AuthProvider from "@/provider/SessionProvider";
import { getServerSession } from "next-auth";
import Providers from "@/provider/Providers";
import CartHydrator from "@/provider/CartHydrator";
import "keen-slider/keen-slider.min.css";

export const metadata = {
  metadataBase: new URL("https://www.novusmode.com/"),
  title: {
    default: "NovusMode — Trendy Apparel at Fair Prices",
    template: "%s | NovusMode",
  },
  description:
    "Discover affordable, stylish apparel for men, women, and kids. Fast shipping, easy returns.",
  icons: {
    icon: "/favicon.ico", // or .png
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: "https://www.novusmode.com/",
    siteName: "NovusMode",
    title: "NovusMode — Trendy Apparel",
    description:
      "Affordable, stylish apparel for everyone. Fast shipping, easy returns.",
  },
};

export default async function RootLayout({ children }) {
  const session = await getServerSession();
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen flex flex-col">
        <AuthProvider session={session}>
          <HeaderServer />
          <CartHydrator>
            <Providers>
              <main>{children}</main>
            </Providers>
          </CartHydrator>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
