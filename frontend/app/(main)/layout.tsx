import { Sidebar } from "@/components/Sidebar"
import { Header } from "@/components/Header"
import { useRouter } from "next/navigation"

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex h-screen overflow-hidden">
            <div className="w-64 h-full fixed left-0 top-0 z-50">
            <Sidebar />
            </div>
            <div className="ml-64 w-full flex flex-col">
                <div className="sticky top-0 z-40">
                    <Header />
                </div>
                <main className="flex-1 overflow-y-auto px-6 py-4 bg-gradient-to-b from-zinc-800 to-black">
                {children}
                </main>
            </div>
        </div>
    );
} 