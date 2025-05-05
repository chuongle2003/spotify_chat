// Cách khác: Không sử dụng phần mở rộng .ts
import postmanApi from "./postman"
export { postmanApi as api }
export * from "./postman"

export const authApi = postmanApi.auth
export const accountsApi = postmanApi.accounts
export const chatApi = postmanApi.chat
export const musicApi = postmanApi.music
export default postmanApi