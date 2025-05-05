"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Music, Disc, ListMusic, Settings, ChevronLeft, ChevronRight, AlertCircle, MessageSquare, Flag, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const tabs = [
    { id: "dashboard", label: "Bảng điều khiển", icon: LayoutDashboard, href: "/admin" },
    { id: "users", label: "Người dùng", icon: Users, href: "/admin/users" },
    { id: "messages", label: "Tin nhắn", icon: MessageSquare, href: "/admin/messages" },
    { id: "reports", label: "Báo cáo", icon: Flag, href: "/admin/reports" },
    { id: "restrictions", label: "Hạn chế chat", icon: Shield, href: "/admin/restrictions" },
    { id: "songs", label: "Bài hát", icon: Music, href: "/admin/songs" },
    { id: "albums", label: "Album", icon: Disc, href: "/admin/albums" },
    { id: "playlists", label: "Playlist", icon: ListMusic, href: "/admin/playlists" },
    { id: "error-codes", label: "Mã lỗi", icon: AlertCircle, href: "/admin/error-codes" },
    { id: "settings", label: "Cài đặt", icon: Settings, href: "/admin/settings" },
  ]

  const isActive = (href: string) => {
    if (href === "/admin" && pathname === "/admin") {
      return true
    }
    if (href !== "/admin" && pathname?.startsWith(href)) {
      return true
    }
    return false
  }

  return (
    <div
      className={cn(
        "bg-zinc-900 border-r border-zinc-800 transition-all duration-300 relative",
        collapsed ? "w-20" : "w-64",
      )}
    >
      {/* Collapse toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-6 rounded-full bg-zinc-800 border border-zinc-700 z-10"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      <div className="p-4 space-y-4 h-full">
        <div className="space-y-1">
          {tabs.map((tab) => (
            <Link href={tab.href} key={tab.id}>
              <Button
                variant={isActive(tab.href) ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive(tab.href) ? "bg-green-500/20 text-green-500 hover:bg-green-500/30 hover:text-green-500" : "",
                  collapsed ? "px-0 justify-center" : "",
                )}
              >
                <tab.icon className={cn("h-5 w-5", collapsed ? "" : "mr-2")} />
                {!collapsed && <span>{tab.label}</span>}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
