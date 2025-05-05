// Re-export components từ app/components/chat
import ChatList from "@/app/components/chat/ChatList";
import ChatBox from "@/app/components/chat/ChatBox";

export { ChatList, ChatBox };

// Giữ lại export component ChatComponent (legacy) để hỗ trợ backward compatibility
export { default as ChatComponent } from "./ChatComponent";
