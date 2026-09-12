# BeePOS · báo cáo ngày 12/09 đêm 13/09 (design pass, restyle, tính năng, audit BeeUI)

Người viết: Ambrose · 2026-09-13 02:45 · bản live: https://beepos.beemvp.com (HN01 / 1234) · commit cuối `333c423`

## 1. Kết quả một dòng
Từ bản "chạy được nhưng xấu" sáng 12/09, BeePOS giờ có thiết kế có căn cứ, giao diện đồng nhất ở phone / tablet / desktop, tính năng POS thật (đa đơn, quét mã vạch, lưu dữ liệu, in hoá đơn, palette lệnh), 286 unit test, 23 kịch bản E2E chạy xanh trên production, đã kiểm trên iOS và Android; kèm 19 issue BeeUI mới trong ngày (tổng 50 issue BeePOS đã file, #560 đến #609).

## 2. Các phase đã đóng (plan `plans/260912-1054-beepos-design-pass/`)
| Phase | Nội dung | Bằng chứng |
|---|---|---|
| 1 Thiết kế | Khảo sát KiotViet, Sapo, Square, Loyverse; design direction (token, icon lucide, thang chữ, mật độ, quy tắc bảng/danh sách); mockup 6 màn x 3 bề rộng, 3 bản sửa theo góp ý (đa đơn, ảnh sản phẩm, desktop) | `docs/design/`, `preview/*.png` |
| 2 Restyle | Shell 3 dải (tab / rail / sidebar), login căn giữa, thẻ có ảnh (31 ảnh Open Food Facts + Pexels có credit), store nhiều giỏ, 31 màn hình theo direction | `docs/design/after/` |
| 3 Polish + native | 8 mục polish, quét thang chữ (171 chỗ), iOS + Android happy path, 9/11 lỗi native sửa | `docs/screenshots/ios-restyle-*`, `android-restyle-*`, `ios-fix-*` |
| 4 Desktop density | Sidebar gập được + POS tự rail, header 48 pt có chip đổi cửa hàng, toolbar một hàng, dải stat, hàng 48 pt | chrome trước dữ liệu: kho 47% → 19%, đơn 34% → 19% |
| 5 Tính năng (đêm) | Quét mã vạch keyboard-wedge, thêm nhanh khách, đặt tên đơn, preset giảm giá, in / chia sẻ hoá đơn, lưu dữ liệu trên máy + reset, palette Cmd+K, trợ giúp phím tắt, xuất CSV, dark mode đạt AA, review code 28 finding, 7 spec E2E mới, harness 1000 sản phẩm, smoke iOS + 5 lỗi sửa | báo cáo `reports/phase-05-*.md` |

## 3. Số đo cuối
| Chỉ số | Giá trị |
|---|---|
| Unit test (jest) | 286 / 286 |
| E2E Playwright | 23 kịch bản, 9 file, 4,2 phút local; 23 / 23 trên production (`85c96b6`), lượt cuối sau `333c423` đang chạy lúc viết |
| Perf lưới sản phẩm 1000 SKU | thẻ đầu 59 ms, p95 frame 16,8 ms, 0 frame quá 100 ms (sau khi bật windowing FlatList) |
| Thẻ trên màn hình đầu ở phone 375 | 2 → 6 |
| Commit trong ngày | 36 |
| Lỗi lint | 0 |

## 4. Lỗi đáng chú ý tìm được và đã sửa (của BeePOS)
- Đăng nhập đối chiếu với seed thay vì store nhân viên: đổi PIN, khoá nhân viên không có tác dụng. Sửa + 6 test.
- Toàn bộ phím tắt web chết khi con trỏ ở ô tìm kiếm (Input BeeUI chặn keydown nổi bọt). Chuyển 5 listener sang capture phase, thêm E2E.
- Thang chữ: các class `text-caption`/`text-label`/... không sinh CSS nên mọi màn hình vẽ chữ cỡ 16 suốt phase 2. Quét sang `Text variant`.
- Theme "Theo hệ thống" kẹt sau một lần chọn thủ công (Uniwind `setTheme('system')` không hoạt động). App tự đọc OS.
- Ảnh fallback danh mục Đồ uống là ảnh Coca-Cola gắn lên Trà xanh. Bỏ, dùng monogram.
- Hai đường nóng O(n·m) trên POS (lưới quét tồn kho từng thẻ mỗi frame; tính tổng giỏ quét toàn catalog). Chuyển sang Map.

## 5. BeeUI: 19 issue mới trong ngày (batch 10 đến 17 trên sổ #234)
Nặng nhất theo thứ tự nên sửa: #606 Input chặn keydown nổi bọt · #599 thang chữ không dùng được qua class · #598 SafeArea nuốt padding · #609 setTheme('system') không theo OS · #593 + 18-03 ButtonLabel sai màu theo variant · #604 / #605 th bảng và Avatar đen trong dark · #596 TableRow selected không tô · #595 TableCell không căn phải được · #600 SegmentedControl cắt chữ khi chữ lớn · #608 DialogContent không clip trên iOS · #591 không có tab đóng được. Bản đồ đầy đủ: `docs/beeui-audit/issue-index.md`.

## 6. Còn mở, cần anh quyết
1. Seed cho cả 12 nhân viên cùng PIN 1234 nên mã cửa hàng + PIN chỉ định danh được cửa hàng, không định danh người; báo cáo thu ngân vì thế gán tuỳ tiện. Đổi seed thì phải đổi E2E login. Đề xuất: PIN riêng từng người, E2E dùng PIN của thu ngân đầu tiên.
2. PIN nhân viên lưu plaintext trên máy (hệ quả của mock auth). Chấp nhận cho prototype hay băm ngay?
3. Toolbar desktop xuống 2 hàng ở 1440 khi sidebar mở (một hàng khi gập). Giữ (không bao giờ cắt nút) hay ép một hàng bằng cách rút bộ lọc vào popover?
4. Báo cáo vẫn dùng thẻ số liệu, các màn danh sách dùng dải. Giữ hay thống nhất?

## 7. Còn mở, tôi tự làm tiếp nếu không có ý kiến khác
- Quét mã vạch trên native cần module bắt phím phần cứng (RN không có global key event); hiện chỉ web.
- Flush AsyncStorage khi app vào background trên native (web đã có `pagehide`).
- VoiceOver / TalkBack ở mức trait cần phiên macOS mở khoá (đêm nay máy khoá, đã dùng Maestro).
- D-08: expo-router setState trước mount trên Android (chỉ dev), theo dõi upstream.
- Chip cửa hàng trên header: hover đã có, cần icon chevron-down riêng thay vì xoay chevron-right.

## 8. Gợi ý bước tiếp theo
1. Chốt 4 câu hỏi mục 6.
2. Kế hoạch nối backend: domain thuần + store đã tách, persistence layer có `pick`/`version`, thay adapter là đủ; nên viết spec API từ `src/domain/types.ts`.
3. Thử trên thiết bị thật (iPhone + Android tầm trung) với máy quét USB/Bluetooth.
4. Gửi BeeUI danh sách ưu tiên mục 5 làm một đợt sửa.
