# List and table column sets

Part of the BeePOS design system. Foundations (breakpoints, tokens, icons, type, density,
dark mode, copy) live in [`../design-direction.md`](../design-direction.md); this file holds
the per-screen table and list specs. Mockups: `mockups/orders.html`, `mockups/inventory.html`, `mockups/chain-ops.html`.

## Column sets per screen

Rule: `table` at >= 768, `list-group` below, never a horizontally scrolling table on phone.
Rows are 56 pt at 768 and 48 pt on desktop and link to the detail route. If a column set does
not fit, fold the secondary value under the primary one (orders folds time under code) or drop
the column; never clip it.

| Screen | Table columns (tablet+) | List row (phone) |
|---|---|---|
| orders | Mã đơn + giờ, Khách hàng, Thu ngân, Thanh toán, Trạng thái, Tổng tiền (right); drop Thu ngân at 768 | line 1 code + total, line 2 time + customer, line 3 status badge + method |
| products | Sản phẩm, SKU, Danh mục, Giá bán, Tồn kho, Trạng thái | line 1 name + price, line 2 SKU + category, trailing stock badge |
| inventory | Sản phẩm, SKU, Tồn kho, Đặt trước, Khả dụng, Định mức, Trạng thái | line 1 name + available, line 2 SKU + min level, trailing state badge |

Money columns are right aligned and tabular in both modes; status is always a `badge` with a
word, never a bare colour dot.
