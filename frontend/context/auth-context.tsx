"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import postmanApi from "@/lib/api/postman"
import { User } from "@/types"

type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  accessToken: string | null
  login: (email: string, password: string) => Promise<void>
  loginWithProvider: (provider: string) => Promise<void>
  register: (userData: {
    email: string;
    username?: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    bio?: string;
  }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const router = useRouter()

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("spotify_token")
      const userDataStr = localStorage.getItem("spotify_user")

      if (token && userDataStr) {
        try {
          // Đọc thông tin người dùng từ localStorage
          const userDataParsed = JSON.parse(userDataStr)

          // Đảm bảo id là string
          const userData = {
            ...userDataParsed,
            id: String(userDataParsed.id)
          }

          setUser(userData)
          setAccessToken(token)
        } catch (error) {
          console.error("Failed to parse user data from localStorage:", error)
          localStorage.removeItem("spotify_token")
          localStorage.removeItem("spotify_refresh_token")
          localStorage.removeItem("spotify_user")
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      console.log("===== ĐẦU QUÁ TRÌNH ĐĂNG NHẬP =====")
      // Call the login API
      const response = await postmanApi.auth.login(email, password)
      const { access, refresh, user: userDataResponse } = response
      console.log("Đăng nhập thành công, nhận được token:", { access: access.substring(0, 15) + "..." })

      // Save tokens
      localStorage.setItem("spotify_token", access)
      localStorage.setItem("spotify_refresh_token", refresh)
      setAccessToken(access)
      console.log("Đã lưu token vào localStorage")

      // Chuyển đổi id từ number sang string để phù hợp với type User
      const userData = {
        ...userDataResponse,
        id: String(userDataResponse.id)
      }

      // Lưu user data từ response login
      setUser(userData)
      localStorage.setItem("spotify_user", JSON.stringify(userData))
      console.log("Đã lưu thông tin người dùng vào state và localStorage")

      // Kiểm tra quyền admin từ response API và chuyển hướng phù hợp
      console.log("Kiểm tra quyền admin. is_admin =", userData.is_admin, "Kiểu dữ liệu:", typeof userData.is_admin)

      if (userData.is_admin === true) {
        console.log("User has admin privileges, redirecting to admin dashboard")
        // Sử dụng timeout để đảm bảo chuyển hướng được thực hiện sau khi state đã được cập nhật
        setTimeout(() => {
          router.push("/admin")
        }, 100)
      } else {
        console.log("User does not have admin privileges, redirecting to dashboard")
        router.push("/dashboard")
      }
    } catch (error: any) {
      console.error("Login failed:", error)

      // Xử lý chi tiết các lỗi API
      if (error.response) {
        // Trường hợp API trả về response với status code
        const status = error.response.status

        if (status === 401) {
          throw new Error("No active account found with the given credentials")
        } else if (status === 404) {
          throw new Error("User not found")
        } else if (status === 400) {
          // Parse lỗi từ API nếu có
          try {
            const errorData = await error.response.json()
            if (errorData && errorData.detail) {
              throw new Error(errorData.detail)
            }
          } catch (parseError) {
            // Nếu không parse được JSON, trả về lỗi mặc định
            throw new Error("Invalid credentials")
          }
        }
      }

      // Trường hợp lỗi không xác định hoặc lỗi mạng
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithProvider = async (provider: string) => {
    setIsLoading(true)
    try {
      // Xác định URL OAuth dựa trên nhà cung cấp
      let authUrl = ""
      const redirectUri = encodeURIComponent(window.location.origin + "/auth/callback")

      switch (provider) {
        case "Google":
          authUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/google/login?redirect_uri=${redirectUri}`
          break
        case "Facebook":
          authUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/facebook/login?redirect_uri=${redirectUri}`
          break
        case "Apple":
          authUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/apple/login?redirect_uri=${redirectUri}`
          break
        default:
          throw new Error(`Không hỗ trợ đăng nhập với ${provider}`)
      }

      // Mở cửa sổ popup cho đăng nhập OAuth
      const width = 600
      const height = 700
      const left = window.innerWidth / 2 - width / 2
      const top = window.innerHeight / 2 - height / 2

      const authWindow = window.open(
        authUrl,
        `Đăng nhập với ${provider}`,
        `width=${width},height=${height},top=${top},left=${left}`,
      )

      // Xử lý kết quả đăng nhập từ cửa sổ popup
      const checkAuthWindow = setInterval(async () => {
        if (authWindow && authWindow.closed) {
          clearInterval(checkAuthWindow)

          // Kiểm tra xem đã có token trong localStorage chưa
          const token = localStorage.getItem("spotify_token")
          if (token) {
            // Lấy thông tin người dùng từ localStorage
            const userDataStr = localStorage.getItem("spotify_user")
            if (userDataStr) {
              try {
                const userDataParsed = JSON.parse(userDataStr)

                // Đảm bảo id là string
                const userData = {
                  ...userDataParsed,
                  id: String(userDataParsed.id)
                }

                setUser(userData)
                setAccessToken(token)

                // Chuyển hướng dựa trên vai trò
                console.log("OAuth login: Kiểm tra quyền admin. is_admin =", userData.is_admin, "Kiểu dữ liệu:", typeof userData.is_admin)
                if (userData.is_admin === true) {
                  console.log("OAuth login: User has admin privileges, redirecting to admin dashboard")
                  // Sử dụng timeout để đảm bảo chuyển hướng được thực hiện sau khi state đã được cập nhật
                  setTimeout(() => {
                    router.push("/admin")
                  }, 100)
                } else {
                  console.log("OAuth login: User does not have admin privileges, redirecting to dashboard")
                  router.push("/dashboard")
                }
              } catch (error) {
                console.error("Failed to parse user data:", error)
                localStorage.removeItem("spotify_token")
                localStorage.removeItem("spotify_refresh_token")
                localStorage.removeItem("spotify_user")
              }
            } else {
              console.error("No user data found in localStorage")
              localStorage.removeItem("spotify_token")
              localStorage.removeItem("spotify_refresh_token")
            }
          } else {
            // Người dùng đã đóng cửa sổ mà không đăng nhập
            console.log(`Đăng nhập với ${provider} đã bị hủy`)
          }
        }
      }, 500)
    } catch (error) {
      console.error(`Đăng nhập với ${provider} thất bại:`, error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: {
    email: string;
    username?: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    bio?: string;
  }) => {
    setIsLoading(true)
    try {
      // Call the register API
      await postmanApi.auth.register(userData)

      // Redirect to login
      router.push("/login")
    } catch (error) {
      console.error("Registration failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("spotify_token")
    localStorage.removeItem("spotify_refresh_token")
    localStorage.removeItem("spotify_user")
    router.push("/")
  }

  const isAdmin = user?.is_admin === true
  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, accessToken, login, loginWithProvider, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
