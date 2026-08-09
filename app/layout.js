import "./globals.css";

export const metadata = {
  title: "Mon Budget Calorique",
  description: "Suis ton apport calorique quotidien simplement.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#24322A",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
