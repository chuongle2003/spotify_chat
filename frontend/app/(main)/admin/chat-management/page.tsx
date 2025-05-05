"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, Check, Filter, Loader2, User, X } from "lucide-react"
import postmanApi from "@/lib/api/postman"

interface Report {
    id: number
    reporter: {
        username: string
        id: number
    }
    reported_user: {
        username: string
        id: number
    }
    message: {
        id: number
        content: string
    }
    reason: string
    status: string
    created_at: string
    updated_at: string
}

interface Restriction {
    id: number
    user: {
        username: string
        id: number
    }
    reason: string
    start_date: string
    end_date: string
    is_active: boolean
    created_by: {
        username: string
        id: number
    }
    created_at: string
}

interface ChatStatistics {
    total_messages: number
    active_users: number
    reported_messages: {
        pending: number
        resolved: number
        dismissed: number
    }
    restrictions: {
        active: number
        expired: number
    }
}

export default function ChatManagementPage() {
    const [activeTab, setActiveTab] = useState("reports")
    const [reports, setReports] = useState<Report[]>([])
    const [restrictions, setRestrictions] = useState<Restriction[]>([])
    const [statistics, setStatistics] = useState<ChatStatistics | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [reportFilter, setReportFilter] = useState("all")
    const [newRestriction, setNewRestriction] = useState({
        username: "",
        reason: "",
        duration: 24, // Số giờ mặc định
    })

    const { user, isAdmin } = useAuth()
    const router = useRouter()

    // Kiểm tra quyền admin
    useEffect(() => {
        if (!user || !isAdmin) {
            toast({
                title: "Truy cập bị từ chối",
                description: "Bạn không có quyền truy cập trang này.",
                variant: "destructive",
            })
            router.push("/dashboard")
        } else {
            loadData()
        }
    }, [user, isAdmin, router])

    // Tải dữ liệu
    const loadData = async () => {
        setIsLoading(true)
        try {
            // Tải báo cáo chat
            const reportsData = await postmanApi.chat.getReports()
            setReports(reportsData)

            // Tải hạn chế chat
            const restrictionsData = await postmanApi.chat.getChatRestrictions()
            setRestrictions(restrictionsData)

            // Tải thống kê
            const statsData = await postmanApi.chat.getReportStatistics()
            setStatistics(statsData)
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error)
            toast({
                title: "Lỗi",
                description: "Không thể tải dữ liệu quản lý chat.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Cập nhật trạng thái báo cáo
    const updateReportStatus = async (reportId: number, newStatus: string) => {
        try {
            await postmanApi.chat.updateReportStatus(reportId.toString(), { status: newStatus })

            // Cập nhật lại danh sách báo cáo
            setReports(prevReports =>
                prevReports.map(report =>
                    report.id === reportId ? { ...report, status: newStatus } : report
                )
            )

            toast({
                title: "Cập nhật trạng thái",
                description: `Báo cáo đã được cập nhật thành: ${newStatus}`,
            })
        } catch (error) {
            console.error("Lỗi khi cập nhật trạng thái báo cáo:", error)
            toast({
                title: "Lỗi",
                description: "Không thể cập nhật trạng thái báo cáo.",
                variant: "destructive",
            })
        }
    }

    // Thêm hạn chế mới
    const addRestriction = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newRestriction.username || !newRestriction.reason) {
            toast({
                title: "Thiếu thông tin",
                description: "Vui lòng nhập đầy đủ tên người dùng và lý do.",
                variant: "destructive",
            })
            return
        }

        try {
            const endDate = new Date()
            endDate.setHours(endDate.getHours() + newRestriction.duration)

            await postmanApi.chat.createChatRestriction({
                username: newRestriction.username,
                reason: newRestriction.reason,
                end_date: endDate.toISOString(),
            })

            toast({
                title: "Thành công",
                description: `Đã hạn chế người dùng ${newRestriction.username} trong ${newRestriction.duration} giờ.`,
            })

            // Reset form và tải lại dữ liệu
            setNewRestriction({
                username: "",
                reason: "",
                duration: 24,
            })

            loadData()
        } catch (error) {
            console.error("Lỗi khi thêm hạn chế:", error)
            toast({
                title: "Lỗi",
                description: "Không thể thêm hạn chế cho người dùng.",
                variant: "destructive",
            })
        }
    }

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('vi-VN')
    }

    // Lọc báo cáo theo trạng thái
    const filteredReports = reportFilter === 'all'
        ? reports
        : reports.filter(report => report.status === reportFilter.toUpperCase())

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6 space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Quản lý Chat</h1>
            </div>

            {/* Thống kê */}
            {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Tổng tin nhắn</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_messages}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Người dùng hoạt động</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.active_users}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Báo cáo đang chờ</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.reported_messages.pending}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Hạn chế đang hoạt động</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.restrictions.active}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs defaultValue="reports" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="reports">Báo cáo vi phạm</TabsTrigger>
                    <TabsTrigger value="restrictions">Hạn chế chat</TabsTrigger>
                </TabsList>

                {/* Tab Báo cáo */}
                <TabsContent value="reports">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Danh sách báo cáo</h2>
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <select
                                    value={reportFilter}
                                    onChange={e => setReportFilter(e.target.value)}
                                    className="bg-background border border-input rounded-md px-3 py-1 text-sm"
                                >
                                    <option value="all">Tất cả</option>
                                    <option value="pending">Đang chờ</option>
                                    <option value="resolved">Đã xử lý</option>
                                    <option value="dismissed">Bỏ qua</option>
                                </select>
                                <Button variant="outline" size="sm" onClick={loadData}>
                                    Làm mới
                                </Button>
                            </div>
                        </div>

                        {filteredReports.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Người báo cáo</TableHead>
                                        <TableHead>Người bị báo cáo</TableHead>
                                        <TableHead>Nội dung</TableHead>
                                        <TableHead>Lý do</TableHead>
                                        <TableHead>Thời gian</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead>Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredReports.map((report) => (
                                        <TableRow key={report.id}>
                                            <TableCell>{report.id}</TableCell>
                                            <TableCell>{report.reporter.username}</TableCell>
                                            <TableCell>{report.reported_user.username}</TableCell>
                                            <TableCell className="max-w-[200px] truncate">
                                                {report.message.content}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate">
                                                {report.reason}
                                            </TableCell>
                                            <TableCell>{formatDate(report.created_at)}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs ${report.status === 'PENDING'
                                                        ? 'bg-yellow-500/10 text-yellow-500'
                                                        : report.status === 'RESOLVED'
                                                            ? 'bg-green-500/10 text-green-500'
                                                            : 'bg-zinc-500/10 text-zinc-500'
                                                    }`}>
                                                    {report.status === 'PENDING'
                                                        ? 'Đang chờ'
                                                        : report.status === 'RESOLVED'
                                                            ? 'Đã xử lý'
                                                            : 'Bỏ qua'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    {report.status === 'PENDING' && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => updateReportStatus(report.id, 'RESOLVED')}
                                                                className="h-8 w-8 text-green-500"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => updateReportStatus(report.id, 'DISMISSED')}
                                                                className="h-8 w-8 text-zinc-500"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">
                                <AlertCircle className="mx-auto h-10 w-10 opacity-20 mb-2" />
                                <p>Không có báo cáo nào phù hợp với bộ lọc</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Tab Hạn chế */}
                <TabsContent value="restrictions">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Form thêm hạn chế */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Thêm hạn chế mới</CardTitle>
                                <CardDescription>
                                    Hạn chế người dùng không cho phép gửi tin nhắn trong thời gian quy định
                                </CardDescription>
                            </CardHeader>
                            <form onSubmit={addRestriction}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="username">Tên người dùng</Label>
                                        <Input
                                            id="username"
                                            value={newRestriction.username}
                                            onChange={(e) => setNewRestriction({ ...newRestriction, username: e.target.value })}
                                            placeholder="Nhập tên người dùng"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reason">Lý do</Label>
                                        <Textarea
                                            id="reason"
                                            value={newRestriction.reason}
                                            onChange={(e) => setNewRestriction({ ...newRestriction, reason: e.target.value })}
                                            placeholder="Nhập lý do hạn chế"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="duration">Thời gian (giờ)</Label>
                                        <Input
                                            id="duration"
                                            type="number"
                                            min="1"
                                            value={newRestriction.duration}
                                            onChange={(e) => setNewRestriction({ ...newRestriction, duration: parseInt(e.target.value) || 24 })}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit">Thêm hạn chế</Button>
                                </CardFooter>
                            </form>
                        </Card>

                        {/* Danh sách hạn chế */}
                        <div className="md:col-span-2">
                            <h2 className="text-xl font-semibold mb-4">Danh sách hạn chế hiện tại</h2>
                            {restrictions.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Người dùng</TableHead>
                                            <TableHead>Lý do</TableHead>
                                            <TableHead>Thời gian bắt đầu</TableHead>
                                            <TableHead>Thời gian kết thúc</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {restrictions.map((restriction) => (
                                            <TableRow key={restriction.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4" />
                                                        {restriction.user.username}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate">
                                                    {restriction.reason}
                                                </TableCell>
                                                <TableCell>{formatDate(restriction.start_date)}</TableCell>
                                                <TableCell>{formatDate(restriction.end_date)}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs ${restriction.is_active ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                                                        }`}>
                                                        {restriction.is_active ? 'Đang hạn chế' : 'Đã hết hạn'}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground">
                                    <AlertCircle className="mx-auto h-10 w-10 opacity-20 mb-2" />
                                    <p>Không có hạn chế nào được áp dụng</p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
} 