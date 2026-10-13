# HH Labs — Bộ nhận diện logo

Xem trực quan tất cả phiên bản: mở `preview.html` trong trình duyệt (cần chạy qua một server tĩnh để phần logo một màu hiển thị, ví dụ `python -m http.server` tại thư mục gốc dự án).

## Ý tưởng

- **Bong bóng hội thoại** — AI biết trò chuyện, lắng nghe và trả lời (Teppy, Trợ lý Karaoke, người thầy NekoGo).
- **Chữ “HH” liền nét** — hai chữ H dùng chung nét giữa; hai thanh ngang lệch nhau như **bậc thang đi lên**, tượng trưng cho sự phát triển.
- **Tia sáng ✦ màu vàng** — “phép màu” của AI.
- **Viền mực + bóng đổ cứng** — phong cách sticker vui tươi, đồng bộ với website.
- Chữ “HH Labs” dùng font **Bricolage Grotesque ExtraBold**, đã chuyển thành đường nét (outline) nên hiển thị đúng ở mọi nơi mà không cần cài font.

## Các file

| File | Dùng khi |
|---|---|
| `logo/hh-labs-logo-horizontal.svg` | Logo chính — website, tài liệu, email, slide (nền sáng) |
| `logo/hh-labs-logo-horizontal-dark.svg` | Logo chính trên nền tối |
| `logo/hh-labs-logo-horizontal-mono.svg` | In một màu, khắc, dập nổi (màu theo `currentColor`) |
| `logo/hh-labs-logo-stacked.svg` / `-dark.svg` | Không gian vuông: poster, áo, sticker, standee |
| `logo/hh-labs-mark.svg` | Chỉ biểu tượng — khi tên “HH Labs” đã xuất hiện gần đó |
| `logo/hh-labs-mark-mono.svg` | Biểu tượng một màu |
| `logo/hh-labs-app-icon.svg` | Avatar mạng xã hội, icon ứng dụng (nền kem, vuông) |
| `logo/favicon.svg` | Favicon trình duyệt (bỏ bóng đổ để nét ở 16–32 px) |
| `logo/png/` | Bản PNG nền trong suốt cho nơi không hỗ trợ SVG; `apple-touch-icon.png` (180 px) và app icon là nền đặc |

## Quy tắc sử dụng

- **Khoảng trống an toàn:** chừa tối thiểu bằng **chiều rộng tia sáng ✦** (≈ 1/3 chiều cao biểu tượng) quanh logo.
- **Kích thước tối thiểu:** logo ngang ≥ **120 px** (hoặc 25 mm khi in); biểu tượng ≥ **24 px** (favicon dùng `favicon.svg`).
- **Nền:** dùng bản thường trên nền sáng / màu thương hiệu, bản `-dark` trên nền tối, bản `mono` khi chỉ in được một màu.
- **Không** kéo giãn, xoay, đổi màu bong bóng, bỏ viền, thêm hiệu ứng (đổ bóng mờ, gradient) hoặc đặt logo trên ảnh nền rối.

## Màu thương hiệu

| Tên | HEX | Vai trò |
|---|---|---|
| Electric Blue | `#3D5AFE` | Màu chính (bong bóng, nút chính) |
| Sunny Yellow | `#FFD23F` | Điểm nhấn (tia sáng, highlight) |
| Ink | `#15131A` | Chữ, viền, bóng đổ |
| Cream | `#FFF7EA` | Nền |
| Coral | `#FF6B4A` | Màu phụ |
| Mint | `#2ED6A1` | Màu phụ |
| Lilac | `#B69CFF` | Màu phụ |

## Font

- Tiêu đề / logo: **Bricolage Grotesque** (Google Fonts, giấy phép OFL)
- Nội dung: **Be Vietnam Pro** (Google Fonts, giấy phép OFL)
