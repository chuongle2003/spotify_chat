import {
    Home,
    Search,
    Library,
    Music2,
    ListMusic,
    Radio,
    Mic2,
    LayoutList,
    Heart,
    Plus,
    User,
    ChevronRight,
    ChevronLeft,
    Pin,
    MessageSquare,
    Download,
} from "lucide-react"

// Các liên kết trong sidebar
export const SIDEBAR_LINKS = [
    {
        label: "Trang chủ",
        href: "/",
        icon: <Home className="h-6 w-6" />,
    },
    {
        label: "Tìm kiếm",
        href: "/search",
        icon: <Search className="h-6 w-6" />,
    },
    {
        label: "Chat",
        href: "/chat",
        icon: <MessageSquare className="h-6 w-6" />,
    },
    {
        label: "Offline",
        href: "/offline",
        icon: <Download className="h-6 w-6" />,
    },
    // ... existing code ...
] 