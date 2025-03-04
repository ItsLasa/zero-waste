
'use client'
import type { Metadata } from "next";
import { useEffect, useState } from "react";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Header from "@/components/Header";
import { getUserByEmail } from "@/utils/db/actions";
import Head from "@/components/Head";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({ subsets: ['latin'] })



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    const fetchTotalEarnings = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail')
        if (userEmail) {
          const user = await getUserByEmail(userEmail)
          console.log('user from layout', user);
          
          if (user) {
            const availableRewards = await getAvailableRewards(user.id) as any
            console.log('availableRewards from layout', availableRewards);
                        setTotalEarnings(availableRewards)
          }
        }
      } catch (error) {
        console.error('Error fetching total earnings:', error)
      }
    }

    fetchTotalEarnings()
  }, [])
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-100 flex-col">
          {/* header */}
          {/* <Head/> */}
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} totalEarnings={totalEarnings} />         
           <div className="flex flex-1"> 
          {/* sidebar */}
          <main className="flex-1 p-4 lg:p-8 ml-0 lg:ml-64 transition-all duration-300 ">
          {children}

          </main>
          </div>
        </div>

      </body>
      <Toaster />
    </html>
  );
}
