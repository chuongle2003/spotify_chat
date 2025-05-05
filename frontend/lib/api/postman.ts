/**
 * Postman-style API client
 * Tổ chức API calls theo cách tương tự như Postman collections và requests
 */

// Cấu hình API
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://spotifybackend.shop",
  defaultHeaders: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

// Interface cho response của thông tin người dùng
export interface UserResponse {
  is_admin: boolean;
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_image?: string;
  following?: string[];
  created_at?: string;
}

// Interface cho response của API đăng nhập
export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    avatar?: string | null;
    bio?: string;
    is_admin: boolean;
  };
}

// Interface cho dữ liệu đăng ký người dùng
export interface RegisterUserData {
  email: string;
  username?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
}

// Lớp cơ sở cho tất cả các requests
class ApiRequest {
  protected async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    customHeaders?: Record<string, string>
  ): Promise<T> {
    // Lấy token từ localStorage (nếu có)
    let token = null;
    if (typeof window !== "undefined") {
      token = localStorage.getItem("spotify_token");
    }

    // Chuẩn bị headers
    const headers: Record<string, string> = {
      ...API_CONFIG.defaultHeaders,
      ...customHeaders,
    };

    // Thêm token vào header nếu có
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Chuẩn bị options cho fetch
    const options: RequestInit = {
      method,
      headers,
    };

    // Thêm body cho các phương thức không phải GET
    if (method !== "GET" && data) {
      if (data instanceof FormData) {
        // Nếu là FormData, không set Content-Type để browser tự xử lý
        delete headers["Content-Type"];
        options.body = data;
      } else {
        options.body = JSON.stringify(data);
      }
    }

    // Xây dựng URL đầy đủ
    const url = new URL(endpoint, API_CONFIG.baseUrl);

    // Thêm query params cho phương thức GET
    if (method === "GET" && data) {
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    try {
      // Thực hiện request
      const response = await fetch(url.toString(), options);

      // Xử lý refresh token nếu token hết hạn (401)
      if (response.status === 401 && token) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Thử lại request với token mới
          return this.request<T>(method, endpoint, data, customHeaders);
        } else {
          // Nếu refresh token thất bại, chuyển hướng về trang đăng nhập
          if (typeof window !== "undefined") {
            localStorage.removeItem("spotify_token");
            localStorage.removeItem("spotify_refresh_token");
            localStorage.removeItem("spotify_user");
            window.location.href = "/login";
          }
          throw new Error("Authentication failed");
        }
      }

      // Kiểm tra response status
      if (!response.ok) {
        // Thêm response vào error để xử lý ở phía trên
        const error: any = new Error(
          `API error: ${response.status} ${response.statusText}`
        );
        error.response = response;
        error.status = response.status;

        // Cố gắng parse body nếu có
        try {
          const errorData = await response.json();
          error.data = errorData;
          if (errorData.detail) {
            error.message = errorData.detail;
          }
        } catch (e) {
          // Nếu không parse được JSON, giữ nguyên message lỗi
        }

        throw error;
      }

      // Parse JSON response
      const result = await response.json();
      return result as T;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Hàm refresh token (định nghĩa ở lớp cha để tránh lỗi TypeScript)
  protected async refreshToken(): Promise<boolean> {
    if (typeof window === "undefined") return false;

    const storedRefreshToken = localStorage.getItem("spotify_refresh_token");
    if (!storedRefreshToken) return false;

    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}/api/v1/auth/token/refresh/`,
        {
          method: "POST",
          headers: API_CONFIG.defaultHeaders,
          body: JSON.stringify({ refresh: storedRefreshToken }),
        }
      );

      if (!response.ok) return false;

      const data = await response.json();
      localStorage.setItem("spotify_token", data.access);
      localStorage.setItem("spotify_refresh_token", data.refresh);
      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  }

  // Các phương thức helper cho các loại request khác nhau
  protected get<T>(endpoint: string, params?: any): Promise<T> {
    return this.request<T>("GET", endpoint, params);
  }

  protected post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>("POST", endpoint, data);
  }

  protected put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>("PUT", endpoint, data);
  }

  protected patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>("PATCH", endpoint, data);
  }

  protected delete<T>(endpoint: string): Promise<T> {
    return this.request<T>("DELETE", endpoint);
  }
}

// Thêm hàm xử lý response có nội dung là media
const handleMediaResponse = async (response: Response) => {
  // Kiểm tra status code
  if (!response.ok) {
    if (response.status === 404) {
      console.error("Media not found:", response.url);
      throw new Error("Media not found");
    }
    const errorText = await response.text();
    console.error("Error fetching media:", errorText);
    throw new Error(
      `Error fetching media: ${response.status} ${response.statusText}`
    );
  }

  // Kiểm tra Content-Type
  const contentType = response.headers.get("Content-Type");
  if (contentType) {
    console.log("Media content type:", contentType);
  }

  return response;
};

// Thêm headers CORS và Accept cho media requests
const getMediaRequestHeaders = () => {
  return {
    Accept: "audio/*, video/*, image/*",
    "Access-Control-Allow-Origin": "*",
  };
};

// Collection cho Auth API
export class AuthCollection extends ApiRequest {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      return await this.post<LoginResponse>("/api/v1/auth/token/", {
        email,
        password,
      });
    } catch (error: any) {
      // Xử lý cụ thể lỗi đăng nhập
      if (error.status === 401) {
        const err = new Error(
          "No active account found with the given credentials"
        );
        err.name = "AuthenticationError";
        throw err;
      }
      throw error;
    }
  }

  // Ghi đè refreshToken (không bắt buộc vì đã có ở lớp cha, nhưng có thể để tùy chỉnh)
  override async refreshToken(): Promise<boolean> {
    return super.refreshToken(); // Gọi implementation ở lớp cha
  }

  register(userData: RegisterUserData) {
    return this.post("/api/v1/accounts/auth/register/", userData);
  }

  // Add password reset methods
  requestPasswordReset(email: string) {
    return this.post("/api/v1/accounts/auth/forgot-password/", { email });
  }

  verifyResetTokenAndSetPassword(
    email: string,
    token: string,
    newPassword: string
  ) {
    return this.post<any>("/api/v1/accounts/auth/verify-reset-token/", {
      email,
      token,
      new_password: newPassword,
    });
  }

  resetPassword(token: string, password: string) {
    return this.post("/api/v1/accounts/password-reset/confirm/", {
      token,
      password,
    });
  }
}

// Collection cho User API
export class AccountsCollection extends ApiRequest {
  getPublicUsers() {
    return this.get<any>("/api/v1/accounts/public/users/");
  }

  getUsers() {
    return this.get<any>("/api/v1/accounts/users/");
  }

  getUsers_ad() {
    return this.get<any>("/api/v1/accounts/admin/users/");
  }

  // Hàm tạo người dùng thông thường
  createUser(userData: any) {
    return this.post<any>("/api/v1/accounts/users/", userData);
  }

  // Hàm tạo người dùng với quyền admin
  createAdminUser(userData: any) {
    return this.post<any>("/api/v1/accounts/admin/users/", userData);
  }

  getUser(id: string) {
    return this.get<any>(`/api/v1/accounts/users/${id}/`);
  }

  // Lấy thông tin chi tiết người dùng (Admin)
  getAdminUserDetail(id: string) {
    return this.get<any>(`/api/v1/accounts/admin/users/${id}/`);
  }

  // Lấy thông tin đầy đủ của người dùng
  getAdminUserComplete(id: string) {
    return this.get<any>(`/api/v1/accounts/admin/users/${id}/complete/`);
  }

  updateUser(id: string, userData: any) {
    return this.put<any>(`/api/v1/accounts/users/${id}/`, userData);
  }

  // Cập nhật thông tin người dùng (Admin)
  updateAdminUser(id: string, userData: any) {
    return this.put<any>(`/api/v1/accounts/admin/users/${id}/`, userData);
  }

  partialUpdateUser(id: string, userData: any) {
    return this.patch<any>(`/api/v1/accounts/users/${id}/`, userData);
  }

  deleteUser(id: string) {
    return this.delete<any>(`/api/v1/accounts/users/${id}/`);
  }

  // Kích hoạt/Vô hiệu hóa tài khoản người dùng
  toggleUserActive(id: string) {
    return this.post<any>(`/api/v1/accounts/admin/users/${id}/toggle_active/`);
  }

  // Cấp/Thu hồi quyền Admin
  toggleUserAdmin(id: string) {
    return this.post<any>(`/api/v1/accounts/admin/users/${id}/toggle_admin/`);
  }

  followUser(id: string) {
    return this.post<any>(`/api/v1/accounts/users/${id}/follow/`);
  }

  unfollowUser(id: string) {
    return this.post<any>(`/api/v1/accounts/users/${id}/unfollow/`);
  }

  getCurrentUser(): Promise<UserResponse> {
    return this.get<UserResponse>("/api/v1/accounts/users/me/");
  }
}

// Collection cho Chat API
export class ChatCollection extends ApiRequest {
  // Chat API v1 mới
  getMessages(username: string) {
    return this.get(`/api/v1/chat/messages/${username}/`);
  }

  getConversations() {
    return this.get(`/api/v1/chat/conversations/`);
  }

  getRecentConversations(limit = 10) {
    return this.get(`/api/v1/chat/recent-conversations/?limit=${limit}`);
  }

  getUnreadCount() {
    return this.get(`/api/v1/chat/unread-count/`);
  }

  markAsRead(username: string) {
    return this.post(`/api/v1/chat/mark-read/${username}/`);
  }

  // Quản lý kết nối người dùng
  getConnections() {
    return this.get(`/api/v1/accounts/connections/`);
  }

  sendConnectionRequest(userId: string) {
    return this.post(`/api/v1/accounts/connection-request/`, {
      user_id: userId,
    });
  }

  acceptConnection(userId: string) {
    return this.post(`/api/v1/accounts/accept-connection/`, {
      user_id: userId,
    });
  }

  declineConnection(userId: string) {
    return this.post(`/api/v1/accounts/decline-connection/`, {
      user_id: userId,
    });
  }

  blockUser(userId: string) {
    return this.post(`/api/v1/accounts/block-user/`, { user_id: userId });
  }

  unblockUser(userId: string) {
    return this.post(`/api/v1/accounts/unblock-user/`, { user_id: userId });
  }

  // API cũ (để tương thích ngược)
  getLegacyMessages(params?: any) {
    return this.get("/api/chat/messages/", params);
  }

  getLegacyMessage(id: string) {
    return this.get(`/api/chat/messages/${id}/`);
  }

  sendLegacyMessage(data: any) {
    return this.post("/api/chat/messages/", data);
  }

  getLegacyConversations() {
    return this.get("/api/chat/conversations/");
  }

  getLegacyConversation(userId: string) {
    return this.get(`/api/chat/conversations/${userId}/`);
  }

  reportMessage(messageId: string, reason: string) {
    return this.post("/api/chat/report/", {
      message_id: messageId,
      reason,
    });
  }

  // Kiểm tra hạn chế người dùng
  checkUserRestriction(
    username: string
  ): Promise<{ is_restricted: boolean; reason?: string; end_date?: string }> {
    return this.get(`/api/chat/check-restriction/${username}`);
  }

  // Admin API
  getAllMessages(params?: any) {
    return this.get("/api/admin/chat/messages/", params);
  }

  getAdminMessage(id: string) {
    return this.get(`/api/admin/chat/messages/${id}/`);
  }

  getReports(params?: any) {
    return this.get("/api/admin/chat/reports/", params);
  }

  getReportDetail(id: string) {
    return this.get(`/api/admin/chat/reports/${id}/`);
  }

  updateReportStatus(reportId: string, data: { status: string }) {
    return this.patch(`/api/admin/chat/reports/${reportId}/`, data);
  }

  getReportStatistics() {
    return this.get("/api/admin/chat/reports/statistics/");
  }

  getPendingReports() {
    return this.get("/api/admin/chat/reports/pending/");
  }

  getChatRestrictions() {
    return this.get("/api/admin/chat/restrictions/");
  }

  createChatRestriction(data: {
    username: string;
    reason: string;
    end_date: string;
  }) {
    return this.post("/api/admin/chat/restrictions/", data);
  }

  updateChatRestriction(id: string, data: any) {
    return this.patch(`/api/admin/chat/restrictions/${id}/`, data);
  }

  getUserChatStats(userId: string) {
    return this.get(`/api/admin/chat/user-stats/${userId}/`);
  }
}

// Collection cho Music API
export class MusicCollection extends ApiRequest {
  // Genre cache
  private genresCache: any[] | null = null;
  private genresCacheExpiry: number = 0;

  // API Quản lý Bài hát
  getSongs(params?: any) {
    return this.get<any[]>("/api/v1/music/songs/", params);
  }

  getSong(id: string) {
    return this.get<any>(`/api/v1/music/songs/${id}/`);
  }

  // Thêm phương thức search
  search(query: string) {
    return this.get<any>("/api/v1/music/search/", { q: query });
  }

  getFeaturedPlaylists() {
    return this.get<any>("/api/v1/music/playlists/featured/");
  }

  getTrendingSongs() {
    return this.get<any>("/api/v1/music/songs/trending/");
  }

  getRecommendedSongs() {
    return this.get<any>("/api/v1/music/recommendations/");
  }

  getPersonalTrends() {
    return this.get<any>("/api/v1/music/trends/personal/");
  }

  createSong(songData: FormData) {
    return this.post<any>("/api/v1/music/songs/", songData);
  }

  updateSong(id: string, songData: any) {
    return this.put<any>(`/api/v1/music/songs/${id}/`, songData);
  }

  deleteSong(id: string) {
    return this.delete<any>(`/api/v1/music/songs/${id}/`);
  }

  // API Quản lý Nghệ sĩ
  getArtists() {
    return this.get<any>("/api/v1/music/artists/");
  }

  getArtist(id: string) {
    return this.get<any>(`/api/v1/music/artists/${id}/`);
  }

  createArtist(artistData: FormData) {
    return this.post<any>("/api/v1/music/artists/", artistData);
  }

  updateArtist(id: string, artistData: any) {
    return this.put<any>(`/api/v1/music/artists/${id}/`, artistData);
  }

  // API Quản lý Thể loại
  async getGenres() {
    const now = Date.now();
    // Sử dụng cache nếu còn hạn (10 phút)
    if (this.genresCache && this.genresCacheExpiry > now) {
      return this.genresCache;
    }

    try {
      const genres = await this.get<any[]>("/api/v1/music/genres/");
      // Cập nhật cache
      this.genresCache = genres;
      this.genresCacheExpiry = now + 10 * 60 * 1000; // 10 phút
      return genres;
    } catch (error) {
      // Nếu lỗi mà có cache, trả về cache cũ
      if (this.genresCache) {
        return this.genresCache;
      }
      // Nếu không có cache, trả về mảng rỗng
      console.error("Error fetching genres:", error);
      return [];
    }
  }

  getGenre(id: string) {
    return this.get<any>(`/api/v1/music/genres/${id}/`);
  }

  createGenre(genreData: FormData) {
    return this.post<any>("/api/v1/music/genres/", genreData);
  }

  updateGenre(id: string, genreData: any) {
    return this.put<any>(`/api/v1/music/genres/${id}/`, genreData);
  }

  deleteGenre(id: string) {
    return this.delete<any>(`/api/v1/music/genres/${id}/`);
  }

  // API Quản lý Album
  getAlbums() {
    return this.get<any>("/api/v1/music/albums/");
  }

  getAlbum(id: string) {
    return this.get<any>(`/api/v1/music/albums/${id}/`);
  }

  createAlbum(albumData: FormData) {
    return this.post<any>("/api/v1/music/albums/", albumData);
  }

  updateAlbum(id: string, albumData: any) {
    return this.put<any>(`/api/v1/music/albums/${id}/`, albumData);
  }

  // API Quản lý Playlist
  getPlaylists() {
    return this.get<any>("/api/v1/music/playlists/");
  }

  getPlaylist(id: string) {
    return this.get<any>(`/api/v1/music/playlists/${id}/`);
  }

  // API Quản lý playlist cộng tác
  getCollaborativePlaylists() {
    return this.get<any>("/api/v1/music/admin/playlists/collaborative/");
  }

  getCollaborativePlaylist(id: string) {
    return this.get<any>(`/api/v1/music/admin/playlists/collaborative/${id}/`);
  }

  getPlaylistCollaborators(playlistId: string) {
    return this.get<any>(
      `/api/v1/music/admin/playlists/${playlistId}/collaborators/`
    );
  }

  addPlaylistCollaborator(playlistId: string, data: any) {
    return this.post<any>(
      `/api/v1/music/admin/playlists/${playlistId}/collaborators/add/`,
      data
    );
  }

  updateCollaboratorRole(playlistId: string, userId: string, role: string) {
    return this.put<any>(
      `/api/v1/music/admin/playlists/${playlistId}/collaborators/${userId}/role/`,
      { role }
    );
  }

  getPlaylistEditHistory(playlistId: string) {
    return this.get<any>(
      `/api/v1/music/admin/playlists/${playlistId}/edit_history/`
    );
  }

  restorePlaylist(playlistId: string, historyId: number) {
    return this.post<any>(
      `/api/v1/music/admin/playlists/${playlistId}/restore/`,
      {
        history_id: historyId,
      }
    );
  }

  // API Thống kê và Báo cáo
  getMusicStatistics() {
    return this.get<any>("/api/v1/music/admin/statistics/");
  }

  getTopSongsReport(params?: any) {
    return this.get<any>("/api/v1/music/admin/reports/top-songs/", params);
  }

  getTopGenresReport() {
    return this.get<any>("/api/v1/music/admin/reports/top-genres/");
  }

  getUserGrowthReport() {
    return this.get<any>("/api/v1/music/admin/reports/user-growth/");
  }

  getEngagementReport() {
    return this.get<any>("/api/v1/music/admin/reports/engagement/");
  }

  // API Kiểm duyệt nội dung
  getModerationSongs(status?: string) {
    return this.get<any>("/api/v1/music/admin/moderation/songs/", { status });
  }

  updateSongModerationStatus(id: string, data: any) {
    return this.put<any>(`/api/v1/music/admin/moderation/songs/${id}/`, data);
  }

  // Ghi nhận lượt phát
  playSong(songId: string) {
    return this.post<any>(`/api/v1/music/songs/${songId}/play/`);
  }

  // Quản lý queue và player
  getQueue() {
    return this.get<any>("/api/v1/music/queue/");
  }

  // Thêm các phương thức mới
  likeSong(songId: string) {
    return this.post<any>(`/api/v1/music/songs/${songId}/like/`);
  }

  unlikeSong(songId: string) {
    return this.post<any>(`/api/v1/music/songs/${songId}/unlike/`);
  }

  removeSongFromPlaylist(playlistId: string, songId: string) {
    return this.delete<any>(
      `/api/v1/music/playlists/${playlistId}/songs/${songId}/`
    );
  }

  addSongToPlaylist(playlistId: string, songId: string) {
    return this.post<any>(`/api/v1/music/playlists/${playlistId}/songs/`, {
      song_id: songId,
    });
  }

  // Thêm phương thức kiểm tra theo dõi playlist
  checkFollowingPlaylist(playlistId: string) {
    return this.get<{ is_following: boolean }>(
      `/api/v1/music/playlists/${playlistId}/check-following/`
    );
  }

  followPlaylist(playlistId: string) {
    return this.post<any>(`/api/v1/music/playlists/${playlistId}/follow/`);
  }

  unfollowPlaylist(playlistId: string) {
    return this.post<any>(`/api/v1/music/playlists/${playlistId}/unfollow/`);
  }
}

export class OfflineCollection extends ApiRequest {
  getDownloads() {
    return this.get<any>("/api/v1/offline/downloads/");
  }

  downloadSong(songId: number | string) {
    return this.post<any>("/api/v1/offline/downloads/", { song_id: songId });
  }

  getDownloadStatus(downloadId: number | string) {
    return this.get<any>(`/api/v1/offline/downloads/${downloadId}/status/`);
  }

  deleteDownload(downloadId: number | string) {
    return this.delete<any>(`/api/v1/offline/downloads/${downloadId}/`);
  }
}

// Tạo các instance của các collection
export const postmanApi = {
  auth: new AuthCollection(),
  accounts: new AccountsCollection(),
  chat: new ChatCollection(),
  music: new MusicCollection(),
  offline: new OfflineCollection(),
};

// Export default
export default postmanApi;
