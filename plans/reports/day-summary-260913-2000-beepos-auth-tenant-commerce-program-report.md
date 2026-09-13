# BeePOS · báo cáo ngày 13/09 (auth, chuỗi và multi-tenant, chương trình thương mại)

Người viết: Ambrose · 2026-09-13 20:00 · bản live: https://beepos.beemvp.com · commit cuối `8a2cc03`
Đăng nhập demo: `owner@chuoi.vn` / `BeePOS@2026`, PIN mở khoá 1000 (bảng đầy đủ trong README).

## 1. Kết quả một dòng
Trong một ngày, BeePOS đi từ "POS bán lẻ một chuỗi, đăng nhập bằng mã cửa hàng" thành hệ thống có tài khoản chuẩn, phân quyền, nhiều chuỗi trên một tài khoản, bán sỉ B2B với bảng giá và công nợ, quản lý tiền và giá vốn, kho đợt 2, đổi trả, khuyến mãi, thông báo; 741 unit test, 79 kịch bản E2E xanh trên production, đã kiểm trên iOS.

## 2. Ba phase đã đóng hôm nay
| Phase | Nội dung | Plan |
|---|---|---|
| 6 Auth + tenant + chain ops | email + mật khẩu băm (10k vòng), phiên có hạn, chọn cửa hàng và quầy, màn khoá PIN và đổi thu ngân, ma trận quyền 16 permission x 3 vai trò, mời nhân viên, onboarding chuỗi, org `chuoi-tap-hoa` với `orgId` trên mọi thực thể, persistence theo org; nhà cung cấp, giá theo cửa hàng, thu chi ca, báo cáo Z, nhật ký; toolbar một hàng với popover bộ lọc, báo cáo dải số | `plans/260913-0903-beepos-chain-tenant/` |
| 7 Chương trình thương mại (A đến J) | B2B lai, mô hình giá 6 bậc, khuyến mãi, tích điểm theo hạng, giá vốn bình quân và COGS snapshot, sổ quỹ, công nợ phải thu / phải trả, đổi trả và credit note, PO, trả NCC, lô hạn, CSV, nhiều mã vạch, cài đặt theo cửa hàng, đổi chuỗi, trung tâm thông báo, 6 báo cáo mới; review 28 + finding; 44 E2E mới; smoke iOS 29 bước; scanner phần cứng trên native; flush AsyncStorage khi vào nền | `plans/260913-1115-beepos-commerce-program/` |
| Rà soát | `docs/chain-multitenant-gap-analysis.md`: ma trận Có / Một phần / Thiếu, ưu tiên P1 đến P3 | |

## 3. Số đo cuối
| Chỉ số | Giá trị |
|---|---|
| Unit test | 741 / 741 (57 suite) |
| E2E | 79 kịch bản, 21 file, 6 phút local; production xem dòng cuối bảng |
| Ma trận phủ E2E | 48 mục A đến G, không mục nào bỏ trống (`docs/qa/e2e-coverage-260913.md`) |
| Perf lưới sỉ 1000 SKU | p95 33 ms, 0 đến 1 frame quá 100 ms (`docs/qa/perf-260913.md`) |
| Mã nguồn `src/` | khoảng 54.000 dòng, 17 feature |
| Commit hôm nay | 32 |
| BeeUI issue mới hôm nay | #610 đến #615 (6) + comment; tổng BeePOS đã file 56 |
| E2E production cuối | 73 passed (9.0m) sau `8a2cc03` |

## 4. Mockup trước khi code
`docs/design/mockups/auth.html`, `chain-ops.html`, `commerce-sales.html`, `commerce-ops.html`; số liệu trong mockup khớp nhau (Z report, sổ quỹ, công nợ Minh Long 52.400.000 đ) và seed khớp mockup (test khoá số liệu). Tài liệu thiết kế tách thành `design-direction.md` (nền) + `docs/design/specs/*.md`.

## 5. Lỗi đáng chú ý đã bắt và sửa trong ngày
- Đổi chuỗi chỉ đổi khoá lưu trữ, dữ liệu vẫn là chuỗi 1 (review); trên native scope đọc sync nên relaunch quay về chuỗi demo (native pass). Cả hai đã sửa, có E2E và kiểm kill / relaunch.
- Credit note khi đổi hàng ghi cả giá trị hàng trả thay vì phần hoàn (review), tặng không hàng thay thế cho khách ghi nợ.
- Thu tiền vào két từ màn ca "không ghi gì": thực ra bàn phím số che nút ghi, tap rơi vào phím; sửa bằng ScrollView nhận keyboard cho 4 màn form (native pass).
- Sổ quỹ không thấy tiền mặt từ quầy; quầy bỏ qua quy tắc tích điểm; thẻ bán lẻ hiện giá gốc trong khi giỏ tính khuyến mãi (E2E tổng lộ ra), đã sửa và có spec đối soát tiền.
- Select của BeeUI có hơn 8 lựa chọn không bấm được bằng chuột (#612), Input chặn keydown (#606) và ẩn giá trị với VoiceOver khi có label (#614).

## 6. Quyết định đã tự chốt, anh xem có phản đối không
1. B2B dạng lai (công tắc "Bán sỉ" từng đơn), không phải thuần B2B.
2. Giá ưu tiên 6 bậc: giá riêng khách > bậc số lượng > bảng giá nhóm > chiết khấu nhóm > giá cửa hàng > giá niêm yết; khuyến mãi áp lên trên, có cờ cộng dồn; khuyến mãi áp cho cả bán lẻ.
3. Quyền mặc định: chủ chuỗi tất cả; quản lý trừ báo cáo chuỗi, cửa hàng, cài đặt; thu ngân chỉ bán, giảm giá, xem đơn, khách, thu chi ca; màn trả hàng cần quyền hoàn tiền.
4. Ghi nợ không phải một phương thức thanh toán: đơn ghi nợ tạo hoá đơn công nợ, không có payment giả.
5. Chuỗi mới tạo bắt đầu với catalog và mọi dữ liệu rỗng, có empty state dẫn sang nhập CSV.
6. Bàn giao tiền cuối ca ghi bằng tiền đếm trừ tiền đầu ca (tiền lẻ đầu ca ở lại két).
7. Mã PO `PO-<mã cửa hàng>-<yyyymmdd>-<stt>`; credit note khi đổi hàng bằng phần hoàn.

## 7. Còn mở
- `tierFor` vẫn dùng ngưỡng hạng cố định thay vì `LoyaltyRule.tierThresholds` (đổi sẽ dịch hạng khách seed).
- Scanner phần cứng trên Android chưa kiểm (chỉ iOS, và Maestro gõ chậm hơn máy quét thật nên chưa chạy được happy path tự động).
- iPad và Android smoke chưa chạy trong ngày; VoiceOver mức trait vẫn cần phiên macOS mở khoá.
- Hoá đơn VAT: số và ký hiệu là placeholder, e-invoice là việc backend.
- Doc thiết kế: `design-direction.md` 199 dòng + 4 spec; lần thêm tiếp theo cần cân nhắc tách tiếp.

## 8. Bước tiếp theo đề xuất
1. Anh thử bản live theo kịch bản sỉ: đăng nhập owner, mở đơn, bật Bán sỉ, chọn "Minh Long", đổi đơn vị thùng, ghi nợ, xem công nợ ở Tiền.
2. Spec API backend từ `src/domain/types.ts` và các store (persistence layer đã có pick / version, thay adapter là đủ).
3. Đợt sửa BeeUI theo thứ tự đòn bẩy ở `docs/beeui-audit/issue-index.md` (batch 10 đến 22).
