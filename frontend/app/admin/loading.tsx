import type { ReactNode } from "react"
import AdminRoute from "@/components/admin-router"
import AdminSidebar from "@/components/admin/sidebar"
import AdminHeader from "@/components/admin/header"

export const metadata = {
  title: "Admin Dashboard - Spotify Clone",
  description: "Admin dashboard for Spotify Clone",
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminRoute>
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Header */}
        <AdminHeader />

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <AdminSidebar />

          {/* Main content */}
          <div className="flex-1 p-6 md:p-8 bg-zinc-900 min-h-screen overflow-auto">{children}</div>
        </div>
      </div>
    </AdminRoute>
  )
}
