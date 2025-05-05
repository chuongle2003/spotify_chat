"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "@/context/chat-context"
import { useAuth } from "@/context/auth-context"
import Image from "next/image"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { MoreHorizontal, Flag, AlertCircle } from "lucide-react"
import postmanApi from "@/lib/api/postman"

interface ChatBoxProps {
    recipientUsername: string
}

export default function ChatBox({ recipientUsername }: ChatBoxProps) {
    const [message, setMessage] = useState("")
    const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
    const [reportDialog, setReportDialog] = useState(false)
    const [reportReason, setReportReason] = useState("")
    const [selectedMessage, setSelectedMessage] = useState<any>(null)
    const [isRestricted, setIsRestricted] = useState(false)
    const [restrictionInfo, setRestrictionInfo] = useState<{ reason?: string, end_date?: string }>({})

    const {
        messages,
        sendMessage,
        setTyping,
        typingUsers,
        isConnected,
        isLoading,
        connectToChat
    } = useChat()

    const { user } = useAuth()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Kết nối đến chat khi component mount hoặc khi đổi người nhận
    useEffect(() => {
        connectToChat(recipientUsername)
        checkRestriction()

        // Cleanup khi component unmount
        return () => {
            if (typingTimeout) {
                clearTimeout(typingTimeout)
            }
        }
    }, [recipientUsername])

    // Kiểm tra người dùng có bị hạn chế không
    const checkRestriction = async () => {
        if (!user) return

        try {
            const { is_restricted, reason, end_date } = await postmanApi.chat.checkUserRestriction(user.username)
            setIsRestricted(is_restricted)
            if (is_restricted) {
                setRestrictionInfo({ reason, end_date })
            }
        } catch (error) {
            console.error("Lỗi khi kiểm tra hạn chế:", error)
        }
    }

    // Cuộn xuống cuối danh sách tin nhắn khi có tin nhắn mới
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    // Kiểm tra trạng thái đang nhập và gửi sự kiện tương ứng
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value)

        // Xóa timeout cũ nếu có
        if (typingTimeout) {
            clearTimeout(typingTimeout)
        }

        // Gửi trạng thái đang nhập
        setTyping(true, recipientUsername)

        // Đặt timeout để gửi trạng thái dừng nhập sau 2 giây không hoạt động
        const timeout = setTimeout(() => {
            setTyping(false, recipientUsername)
        }, 2000)

        setTypingTimeout(timeout)
    }

    // Gửi tin nhắn
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim()) return

        if (sendMessage(message, recipientUsername)) {
            setMessage("")
            // Gửi trạng thái dừng nhập sau khi gửi tin nhắn
            setTyping(false, recipientUsername)
        }
    }

    // Format thời gian
    const formatTime = (timestamp: string) => {
        if (!timestamp) return ""
        try {
            return formatDistanceToNow(new Date(timestamp), {
                addSuffix: true,
                locale: vi
            })
        } catch (error) {
            return ""
        }
    }

    // Kiểm tra xem người dùng có đang nhập không
    const isRecipientTyping = typingUsers.some(
        (user) => user.username === recipientUsername && user.is_typing
    )

    // Hiển thị trạng thái kết nối
    const getConnectionStatus = () => {
        if (isLoading) return "Đang kết nối..."
        if (isConnected) return "Đang kết nối"
        return "Đã mất kết nối"
    }

    // Kiểm tra tin nhắn là của người dùng hiện tại hay không
    const isCurrentUser = (username: string) => {
        return username === user?.username || username === user?.email
    }

    // Mở dialog báo cáo tin nhắn
    const handleReportMessage = (msg: any) => {
        setSelectedMessage(msg)
        setReportDialog(true)
    }

    // Gửi báo cáo
    const submitReport = async () => {
        if (!selectedMessage || !reportReason.trim()) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập lý do báo cáo",
                variant: "destructive",
            })
            return
        }

        try {
            await postmanApi.chat.reportMessage(selectedMessage.id, reportReason)

            toast({
                title: "Báo cáo đã được gửi",
                description: "Cảm ơn bạn đã báo cáo nội dung không phù hợp",
            })

            setReportDialog(false)
            setReportReason("")
            setSelectedMessage(null)
        } catch (error) {
            console.error("Lỗi khi báo cáo tin nhắn:", error)
            toast({
                title: "Lỗi",
                description: "Không thể gửi báo cáo, vui lòng thử lại sau",
                variant: "destructive",
            })
        }
    }

    return (
        <div className="flex flex-col h-full">
            {/* Thông báo hạn chế */}
            {isRestricted && (
                <div className="bg-red-500/20 p-3 border-b border-red-500/30">
                    <div className="flex items-center text-sm text-red-300">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        <span>
                            Bạn đã bị hạn chế gửi tin nhắn đến {formatDistanceToNow(new Date(restrictionInfo.end_date || ""), {
                                addSuffix: true,
                                locale: vi
                            })}
                        </span>
                    </div>
                    {restrictionInfo.reason && (
                        <div className="mt-1 text-xs text-red-200/70">
                            Lý do: {restrictionInfo.reason}
                        </div>
                    )}
                </div>
            )}

            {/* Phần đầu */}
            <div className="p-4 border-b border-neutral-700 flex items-center">
                <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-white font-bold">
                    {recipientUsername.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                    <h2 className="font-medium">{recipientUsername}</h2>
                    <div className="text-xs text-neutral-400">
                        {getConnectionStatus()}
                    </div>
                </div>
            </div>

            {/* Phần tin nhắn */}
            <div className="flex-1 p-4 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin h-8 w-8 border-t-2 border-white rounded-full"></div>
                    </div>
                ) : messages.length > 0 ? (
                    <div className="space-y-4">
                        {messages.map((msg, index) => {
                            const fromCurrentUser = isCurrentUser(msg.username)
                            return (
                                <div
                                    key={`${msg.username}-${index}-${msg.timestamp || Date.now()}`}
                                    className={`flex ${fromCurrentUser ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-lg px-4 py-2 ${fromCurrentUser
                                            ? "bg-green-600 text-white rounded-tr-none"
                                            : "bg-neutral-700 text-white rounded-tl-none"
                                            } relative group`}
                                    >
                                        <div className="break-words">{msg.message}</div>
                                        <div className="text-xs opacity-70 mt-1 text-right flex justify-between items-center">
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!fromCurrentUser && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-white/60 hover:text-white">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="start">
                                                            <DropdownMenuItem onClick={() => handleReportMessage(msg)}>
                                                                <Flag className="h-4 w-4 mr-2" />
                                                                <span>Báo cáo tin nhắn</span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </span>
                                            {msg.timestamp ? formatTime(msg.timestamp) : "Vừa gửi"}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-neutral-400">
                        Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                    </div>
                )}

                {/* Chỉ báo đang nhập */}
                {isRecipientTyping && (
                    <div className="flex items-center mt-2 text-neutral-400 text-sm">
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                            <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                            <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: "600ms" }}></div>
                        </div>
                        <span className="ml-2">{recipientUsername} đang nhập...</span>
                    </div>
                )}
            </div>

            {/* Phần input */}
            <div className="p-4 border-t border-neutral-700">
                <form onSubmit={handleSendMessage} className="flex items-center">
                    <input
                        type="text"
                        value={message}
                        onChange={handleInputChange}
                        placeholder={isRestricted ? "Bạn đang bị hạn chế gửi tin nhắn" : "Nhập tin nhắn..."}
                        className="flex-1 bg-neutral-800 rounded-l-md border border-neutral-700 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={!isConnected || isRestricted}
                    />
                    <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white rounded-r-md px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!isConnected || !message.trim() || isRestricted}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-5 h-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                            />
                        </svg>
                    </button>
                </form>
            </div>

            {/* Dialog báo cáo tin nhắn */}
            <Dialog open={reportDialog} onOpenChange={setReportDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Báo cáo tin nhắn</DialogTitle>
                        <DialogDescription>
                            Vui lòng cung cấp lý do vì sao tin nhắn này vi phạm quy tắc cộng đồng
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-4">
                        <div className="p-3 bg-neutral-900 rounded border border-neutral-800">
                            <p className="text-sm text-neutral-300">Nội dung tin nhắn:</p>
                            <p className="mt-1">{selectedMessage?.message}</p>
                        </div>
                        <Textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="Nhập lý do báo cáo..."
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReportDialog(false)}>
                            Hủy
                        </Button>
                        <Button onClick={submitReport}>Gửi báo cáo</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
} 