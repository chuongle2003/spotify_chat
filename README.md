# Spotify Chat

Spotify Chat là một ứng dụng web cho phép người dùng nghe nhạc, tạo playlist, tương tác với người dùng khác và sử dụng trí tuệ nhân tạo để khám phá âm nhạc.

## Tính năng chính

### 1. Nghe nhạc

- Phát nhạc trực tuyến
- Tải nhạc để nghe offline
- Tìm kiếm bài hát theo tên, nghệ sĩ, album
- Xem danh sách bài hát thịnh hành
- Khám phá bài hát theo thể loại

### 2. Quản lý Playlist

- Tạo và quản lý playlist cá nhân
- Chia sẻ playlist với người dùng khác
- Theo dõi playlist công khai
- Thêm/xóa bài hát khỏi playlist

### 3. Tương tác xã hội

- Theo dõi người dùng khác
- Bình luận và đánh giá bài hát
- Xem hoạt động của người dùng đang theo dõi
- Chia sẻ bài hát với bạn bè

### 4. AI Assistant

- Trả lời câu hỏi về ứng dụng và cách sử dụng
- Cung cấp thông tin về âm nhạc, nghệ sĩ, thể loại
- Hỗ trợ quản lý playlist và khám phá nhạc mới
- Giải thích các tính năng chat và tương tác xã hội

## Công nghệ sử dụng

### Backend

- Django 5.0.1
- Django REST Framework 3.14.0
- Django Channels 4.0.0
- PostgreSQL
- Redis
- Google Gemini AI API

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- React Query
- Zustand

## Cài đặt và chạy

### Yêu cầu hệ thống

- Python 3.8+
- Node.js 16+
- PostgreSQL
- Redis

### Backend

1. Cài đặt dependencies:

```bash
cd backend
pip install -r requirements.txt
```

2. Cấu hình cơ sở dữ liệu:

```bash
python manage.py migrate
```

3. Chạy server:

```bash
python manage.py runserver
```

### Frontend

1. Cài đặt dependencies:

```bash
cd frontend
npm install
```

2. Chạy development server:

```bash
npm run dev
```

## Phân quyền người dùng

Hệ thống có các loại người dùng sau:

1. **Regular User**: Người dùng thông thường

   - Xem thông tin cá nhân
   - Cập nhật thông tin cá nhân
   - Tạo và quản lý playlist riêng
   - Theo dõi người dùng khác
   - Bình luận và đánh giá bài hát

2. **Staff User**: Nhân viên hệ thống

   - Có tất cả quyền của Regular User
   - Có thêm các quyền tùy theo vai trò được phân công

3. **Content Manager**: Quản lý nội dung

   - Có tất cả quyền của Staff User
   - Quản lý bài hát, album
   - Duyệt bình luận
   - Quản lý các nội dung công cộng

4. **User Manager**: Quản lý người dùng

   - Có tất cả quyền của Staff User
   - Kích hoạt/vô hiệu hóa tài khoản người dùng
   - Xem thông tin chi tiết người dùng
   - Quản lý thông tin người dùng

5. **Playlist Manager**: Quản lý playlist

   - Có tất cả quyền của Staff User
   - Quản lý playlist công cộng
   - Duyệt playlist của người dùng

6. **Admin**: Quản trị viên
   - Có tất cả các quyền trong hệ thống
   - Phân quyền cho các staff
   - Quản lý cấu hình hệ thống

## API Endpoints

### Public Endpoints

- `GET /api/public/users/`: Danh sách người dùng công khai
- `POST /api/auth/register/`: Đăng ký người dùng mới
- `POST /api/token/`: Lấy token đăng nhập

### User Endpoints

- `GET, PUT, PATCH /api/users/me/`: Xem và cập nhật thông tin cá nhân
- `POST /api/users/{id}/follow/`: Theo dõi người dùng
- `POST /api/users/{id}/unfollow/`: Hủy theo dõi người dùng
- `POST /api/auth/logout/`: Đăng xuất

### Music Endpoints

- `GET /api/songs/`: Danh sách bài hát
- `GET /api/songs/{id}/`: Chi tiết bài hát
- `POST /api/songs/{id}/play/`: Phát bài hát
- `GET /api/playlists/`: Danh sách playlist
- `POST /api/playlists/`: Tạo playlist mới
- `GET /api/playlists/{id}/`: Chi tiết playlist

### AI Assistant Endpoints

- `POST /api/v1/ai/chat/`: Chat với AI Assistant
- `GET /api/v1/ai/contexts/`: Lấy danh sách ngữ cảnh

## Đóng góp

Mọi đóng góp cho dự án đều được hoan nghênh. Vui lòng tạo issue hoặc pull request để đóng góp.

## Giấy phép

Dự án được phát triển dưới giấy phép MIT.
