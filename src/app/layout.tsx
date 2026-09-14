import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:{default:"Wordbench — A word solver's desk",template:"%s · Wordbench"},description:"Thoughtful tools for word-game people."};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body><div className="site-shell">{children}</div></body></html>}
