# BeePOS · rà soát năng lực quản lý chuỗi và multi-tenant (2026-09-13)

Thang đánh giá: **Có** (dùng được), **Một phần** (có UI nhưng thiếu nghiệp vụ hoặc thiếu mô hình), **Thiếu**. So với mặt bằng KiotViet, Sapo POS, Square for Retail cho chuỗi 3 đến 30 cửa hàng.

## Kết luận
Bán hàng tại quầy và vận hành một cửa hàng: **đạt mức prototype tốt**. Quản lý chuỗi: **một phần** (có nhiều cửa hàng, chuyển kho, báo cáo theo cửa hàng, nhân viên gán nhiều cửa hàng; thiếu giá theo cửa hàng, nhà cung cấp, sổ quỹ, nhật ký thao tác, phân quyền thật). Multi-tenant: **thiếu** (không có thực thể Organization, không có tài khoản người dùng, mọi dữ liệu ngầm định một chuỗi, đăng nhập bằng mã cửa hàng + PIN dùng chung).

## Ma trận
| Nhóm | Hạng mục | Trạng thái | Ghi chú / việc cần làm |
|---|---|---|---|
| Tenant | Thực thể Organization (chuỗi), mã, gói, cấu hình thuế, tiền tệ, hoá đơn | Thiếu | Thêm `Organization`, mọi thực thể gốc mang `orgId`; onboarding tạo chuỗi + cửa hàng đầu |
| Tenant | Cách ly dữ liệu theo org trong store và persistence | Thiếu | key persistence theo `orgId`; selector lọc theo org phiên |
| Tenant | Chuyển đổi giữa nhiều org của một tài khoản | Thiếu | P3, sau khi có account |
| Auth | Tài khoản người dùng (email + mật khẩu băm), phiên có hạn, đăng xuất, đổi mật khẩu, quên mật khẩu (mock gửi mã) | Thiếu | Hiện: mã cửa hàng + PIN, PIN plaintext, 12 người cùng PIN |
| Auth | PIN riêng từng thu ngân để đổi ca nhanh trên máy quầy, khoá màn hình sau N phút | Một phần | Có PIN nhưng không unique; thiếu lock screen |
| Auth | Máy quầy / register đăng ký theo cửa hàng, phiên gắn register | Thiếu | `Register`; ca làm việc gắn register |
| Phân quyền | Vai trò owner / manager / cashier có ma trận quyền, ẩn/khoá UI theo quyền | Một phần | Có role, chỉ 1 predicate `canViewAllStores`; cần `Permission` + `can()` + guard route |
| Phân quyền | Mời nhân viên qua email, trạng thái invited / disabled | Thiếu | `UserAccount.status` |
| Cửa hàng | CRUD cửa hàng, giờ mở cửa, trạng thái | Có | |
| Cửa hàng | Cấu hình riêng từng cửa hàng (hoá đơn, thuế, máy in) | Một phần | Settings hiện toàn cục |
| Nhân viên | CRUD, gán nhiều cửa hàng, reset PIN | Có | |
| Nhân viên | Chấm công / ca theo người, hiệu suất thu ngân | Một phần | Có báo cáo thu ngân, ca gắn cashierId |
| Catalog | Sản phẩm, biến thể, danh mục, đơn vị, mã vạch, ảnh | Có | Một mã vạch / sản phẩm |
| Catalog | Giá bán theo cửa hàng, bảng giá theo kênh | Thiếu | `StorePrice` override, hiển thị ở POS theo store phiên |
| Catalog | Khuyến mãi (theo %, số tiền, mua X tặng Y, theo thời gian, theo cửa hàng) | Thiếu | `Promotion` + áp dụng tự động trong giỏ |
| Catalog | Import / export CSV | Một phần | Có export; thiếu import |
| Kho | Tồn theo cửa hàng, định mức, cảnh báo, nhập hàng, chuyển kho, kiểm kê, lịch sử biến động | Có | |
| Kho | Nhà cung cấp (thực thể, lịch sử nhập, công nợ) | Thiếu | `Supplier`; receipt đang là chuỗi tên |
| Kho | Đơn đặt hàng NCC (PO) và nhập từ PO | Thiếu | P2 |
| Kho | Trả hàng NCC | Thiếu | P3 |
| Bán hàng | Đa đơn, giảm giá dòng / đơn, khách hàng, ghi chú, thanh toán nhiều cách, hoá đơn, in / chia sẻ, quét mã | Có | Quét mã native cần module |
| Bán hàng | Hoàn trả toàn phần / một phần | Có | |
| Bán hàng | Đổi hàng, hoá đơn treo có tên | Một phần | Đặt tên đơn đã có; đổi hàng chưa |
| Ca và quỹ | Mở / đóng ca, đếm tiền, chênh lệch | Có | |
| Ca và quỹ | Thu / chi tiền mặt trong ca (paid in / out), báo cáo cuối ngày (Z) | Thiếu | `CashMovement`; Z report in được |
| Khách hàng | Hồ sơ, hạng, điểm, lịch sử | Có | |
| Khách hàng | Quy tắc tích điểm cấu hình được, đổi điểm | Một phần | Điểm cố định trong domain |
| Báo cáo | Doanh thu theo kỳ, theo cửa hàng, top sản phẩm, cơ cấu thanh toán, thu ngân | Có | |
| Báo cáo | Theo danh mục, theo giờ, lợi nhuận gộp theo sản phẩm, giá trị tồn, so sánh cửa hàng | Một phần | Có lợi nhuận gộp tổng, giá trị tồn |
| Vận hành | Nhật ký thao tác (ai, làm gì, khi nào) | Thiếu | `AuditEvent`, ghi ở các action nhạy cảm |
| Vận hành | Thông báo (tồn thấp, ca chưa đóng) | Một phần | Chip / banner tại chỗ, không có trung tâm thông báo |
| Vận hành | Offline / đồng bộ | Một phần | Persistence local có; sync là việc backend |
| Nền tảng | Web, iOS, Android một mã nguồn, vi / en, sáng / tối, a11y cơ bản | Có | |

## Ưu tiên đề xuất
- **P1 (phase 6, làm ngay):** Organization + orgId, tài khoản email / mật khẩu băm + phiên + đổi / quên mật khẩu, PIN riêng từng người + khoá màn hình, ma trận quyền + guard, Register theo cửa hàng, nhà cung cấp, giá theo cửa hàng, thu / chi trong ca + báo cáo Z, nhật ký thao tác.
- **P2:** khuyến mãi, import CSV, PO nhà cung cấp, quy tắc tích điểm cấu hình, báo cáo theo danh mục / giờ / lợi nhuận sản phẩm, cấu hình riêng từng cửa hàng.
- **P3:** nhiều org một tài khoản, trả hàng NCC, đổi hàng, trung tâm thông báo.
