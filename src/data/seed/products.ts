import type { Product } from '../../domain/types';
import { ean13 } from './prng';

interface ProductVariantSeed {
  label: string;
  cost: number;
  sale: number;
}

interface ProductTemplate {
  categoryId: string;
  name: string;
  unit: string;
  taxRate: number;
  variants: ProductVariantSeed[];
}

/** 30 base products x 4 size/pack variants = 120 SKUs, realistic Vietnamese grocery catalog. */
const TEMPLATES: ProductTemplate[] = [
  {
    categoryId: 'cat-1',
    name: 'Nước ngọt Coca-Cola',
    unit: 'chai',
    taxRate: 0.1,
    variants: [
      { label: '330ml', cost: 6500, sale: 9000 },
      { label: '500ml', cost: 8500, sale: 12000 },
      { label: '1.5L', cost: 15000, sale: 21000 },
      { label: 'Lốc 6 lon', cost: 42000, sale: 58000 },
    ],
  },
  {
    categoryId: 'cat-1',
    name: 'Trà xanh Không Độ',
    unit: 'chai',
    taxRate: 0.1,
    variants: [
      { label: '350ml', cost: 6000, sale: 8500 },
      { label: '500ml', cost: 7500, sale: 10500 },
      { label: 'Chai 1L', cost: 12000, sale: 17000 },
      { label: 'Thùng 24 chai', cost: 168000, sale: 228000 },
    ],
  },
  {
    categoryId: 'cat-1',
    name: 'Nước suối Lavie',
    unit: 'chai',
    taxRate: 0.1,
    variants: [
      { label: '350ml', cost: 3000, sale: 4500 },
      { label: '500ml', cost: 3800, sale: 5500 },
      { label: '1.5L', cost: 6000, sale: 9000 },
      { label: 'Bình 20L', cost: 28000, sale: 42000 },
    ],
  },
  {
    categoryId: 'cat-1',
    name: 'Bia Saigon',
    unit: 'lon',
    taxRate: 0.1,
    variants: [
      { label: 'Lon 330ml', cost: 11000, sale: 14500 },
      { label: 'Lốc 6 lon', cost: 64000, sale: 84000 },
      { label: 'Thùng 24 lon', cost: 252000, sale: 330000 },
      { label: 'Chai 450ml', cost: 12500, sale: 16500 },
    ],
  },
  {
    categoryId: 'cat-1',
    name: 'Cà phê hoà tan G7',
    unit: 'hộp',
    taxRate: 0.1,
    variants: [
      { label: 'Hộp 12 gói', cost: 28000, sale: 39000 },
      { label: 'Hộp 21 gói', cost: 46000, sale: 63000 },
      { label: 'Túi 50 gói', cost: 105000, sale: 145000 },
      { label: '3in1 hộp 20 gói', cost: 42000, sale: 58000 },
    ],
  },
  {
    categoryId: 'cat-2',
    name: 'Sữa tươi Vinamilk',
    unit: 'hộp',
    taxRate: 0.05,
    variants: [
      { label: '180ml', cost: 5000, sale: 7000 },
      { label: '1L', cost: 26000, sale: 34000 },
      { label: 'Lốc 4 hộp 110ml', cost: 18000, sale: 25000 },
      { label: 'Thùng 48 hộp 110ml', cost: 210000, sale: 285000 },
    ],
  },
  {
    categoryId: 'cat-2',
    name: 'Sữa đặc Ông Thọ',
    unit: 'lon',
    taxRate: 0.05,
    variants: [
      { label: 'Lon 380g', cost: 19000, sale: 26000 },
      { label: 'Tuýp 165g', cost: 9500, sale: 13500 },
      { label: 'Lốc 2 lon', cost: 37000, sale: 50000 },
      { label: 'Thùng 48 lon', cost: 890000, sale: 1180000 },
    ],
  },
  {
    categoryId: 'cat-2',
    name: 'Sữa chua Vinamilk',
    unit: 'hộp',
    taxRate: 0.05,
    variants: [
      { label: 'Vỉ 4 hộp', cost: 16000, sale: 22000 },
      { label: 'Vỉ 6 hộp', cost: 22000, sale: 31000 },
      { label: 'Uống liền 180ml', cost: 6500, sale: 9000 },
      { label: 'Nếp cẩm hộp 100g', cost: 5500, sale: 8000 },
    ],
  },
  {
    categoryId: 'cat-2',
    name: 'Phô mai con bò cười',
    unit: 'hộp',
    taxRate: 0.05,
    variants: [
      { label: 'Hộp 8 miếng', cost: 32000, sale: 44000 },
      { label: 'Hộp 16 miếng', cost: 58000, sale: 79000 },
      { label: 'Hộp 4 miếng', cost: 18000, sale: 25000 },
      { label: 'Hộp 24 miếng', cost: 84000, sale: 115000 },
    ],
  },
  {
    categoryId: 'cat-3',
    name: 'Gạo ST25',
    unit: 'kg',
    taxRate: 0,
    variants: [
      { label: 'Túi 5kg', cost: 145000, sale: 185000 },
      { label: 'Túi 10kg', cost: 280000, sale: 355000 },
      { label: 'Bao 25kg', cost: 650000, sale: 820000 },
      { label: 'Túi 2kg', cost: 62000, sale: 79000 },
    ],
  },
  {
    categoryId: 'cat-3',
    name: 'Gạo Jasmine',
    unit: 'kg',
    taxRate: 0,
    variants: [
      { label: 'Túi 5kg', cost: 95000, sale: 125000 },
      { label: 'Túi 10kg', cost: 185000, sale: 240000 },
      { label: 'Bao 25kg', cost: 430000, sale: 550000 },
      { label: 'Túi 2kg', cost: 42000, sale: 55000 },
    ],
  },
  {
    categoryId: 'cat-3',
    name: 'Yến mạch Quaker',
    unit: 'hộp',
    taxRate: 0.05,
    variants: [
      { label: 'Hộp 200g', cost: 28000, sale: 39000 },
      { label: 'Hộp 400g', cost: 48000, sale: 65000 },
      { label: 'Túi 1kg', cost: 95000, sale: 125000 },
      { label: 'Gói ăn liền 30g x10', cost: 52000, sale: 71000 },
    ],
  },
  {
    categoryId: 'cat-4',
    name: 'Nước mắm Phú Quốc',
    unit: 'chai',
    taxRate: 0.08,
    variants: [
      { label: 'Chai 500ml 40N', cost: 42000, sale: 58000 },
      { label: 'Chai 500ml 30N', cost: 28000, sale: 39000 },
      { label: 'Chai 1L', cost: 78000, sale: 105000 },
      { label: 'Can 5L', cost: 340000, sale: 450000 },
    ],
  },
  {
    categoryId: 'cat-4',
    name: 'Nước tương Maggi',
    unit: 'chai',
    taxRate: 0.08,
    variants: [
      { label: 'Chai 300ml', cost: 12000, sale: 17000 },
      { label: 'Chai 700ml', cost: 24000, sale: 33000 },
      { label: 'Túi 1L', cost: 30000, sale: 41000 },
      { label: 'Chai 200ml', cost: 8500, sale: 12000 },
    ],
  },
  {
    categoryId: 'cat-4',
    name: 'Dầu ăn Neptune',
    unit: 'chai',
    taxRate: 0.08,
    variants: [
      { label: 'Chai 1L', cost: 38000, sale: 51000 },
      { label: 'Chai 2L', cost: 72000, sale: 96000 },
      { label: 'Chai 5L', cost: 172000, sale: 225000 },
      { label: 'Chai 500ml', cost: 21000, sale: 29000 },
    ],
  },
  {
    categoryId: 'cat-4',
    name: 'Bột ngọt Ajinomoto',
    unit: 'gói',
    taxRate: 0.08,
    variants: [
      { label: 'Gói 100g', cost: 8500, sale: 12000 },
      { label: 'Gói 400g', cost: 30000, sale: 41000 },
      { label: 'Gói 1kg', cost: 68000, sale: 89000 },
      { label: 'Gói 200g', cost: 16000, sale: 22000 },
    ],
  },
  {
    categoryId: 'cat-4',
    name: 'Tương ớt Chinsu',
    unit: 'chai',
    taxRate: 0.08,
    variants: [
      { label: 'Chai 250g', cost: 9500, sale: 13500 },
      { label: 'Chai 500g', cost: 16500, sale: 23000 },
      { label: 'Túi 1kg', cost: 28000, sale: 38000 },
      { label: 'Chai 100g', cost: 5500, sale: 8000 },
    ],
  },
  {
    categoryId: 'cat-5',
    name: 'Bánh Oreo',
    unit: 'gói',
    taxRate: 0.1,
    variants: [
      { label: 'Gói 55g', cost: 6000, sale: 9000 },
      { label: 'Gói 133g', cost: 14000, sale: 20000 },
      { label: 'Hộp 12 gói', cost: 68000, sale: 92000 },
      { label: 'Gói 300g', cost: 26000, sale: 36000 },
    ],
  },
  {
    categoryId: 'cat-5',
    name: 'Kẹo Alpenliebe',
    unit: 'gói',
    taxRate: 0.1,
    variants: [
      { label: 'Gói 100g', cost: 9000, sale: 13000 },
      { label: 'Gói 500g', cost: 40000, sale: 55000 },
      { label: 'Hộp 24 viên', cost: 14000, sale: 20000 },
      { label: 'Bịch 1kg', cost: 78000, sale: 105000 },
    ],
  },
  {
    categoryId: 'cat-5',
    name: 'Snack Oishi',
    unit: 'gói',
    taxRate: 0.1,
    variants: [
      { label: 'Gói 40g', cost: 4500, sale: 7000 },
      { label: 'Gói 90g', cost: 9000, sale: 13000 },
      { label: 'Lốc 10 gói', cost: 42000, sale: 58000 },
      { label: 'Gói bịch 150g', cost: 15000, sale: 21000 },
    ],
  },
  {
    categoryId: 'cat-5',
    name: 'Chocopie Orion',
    unit: 'hộp',
    taxRate: 0.1,
    variants: [
      { label: 'Hộp 6 cái', cost: 22000, sale: 30000 },
      { label: 'Hộp 12 cái', cost: 40000, sale: 55000 },
      { label: 'Hộp 20 cái', cost: 62000, sale: 84000 },
      { label: 'Hộp 4 cái', cost: 16000, sale: 22000 },
    ],
  },
  {
    categoryId: 'cat-6',
    name: 'Mì Hảo Hảo',
    unit: 'gói',
    taxRate: 0.1,
    variants: [
      { label: 'Gói 75g', cost: 3500, sale: 5000 },
      { label: 'Thùng 30 gói', cost: 98000, sale: 132000 },
      { label: 'Ly 67g', cost: 6500, sale: 9500 },
      { label: 'Combo 5 gói', cost: 16500, sale: 23000 },
    ],
  },
  {
    categoryId: 'cat-6',
    name: 'Mì Omachi',
    unit: 'gói',
    taxRate: 0.1,
    variants: [
      { label: 'Gói 80g', cost: 6000, sale: 8500 },
      { label: 'Thùng 30 gói', cost: 168000, sale: 225000 },
      { label: 'Ly 90g', cost: 9500, sale: 13500 },
      { label: 'Combo 5 gói', cost: 28000, sale: 39000 },
    ],
  },
  {
    categoryId: 'cat-6',
    name: 'Phở ăn liền Vifon',
    unit: 'gói',
    taxRate: 0.1,
    variants: [
      { label: 'Gói 65g', cost: 6500, sale: 9500 },
      { label: 'Ly 68g', cost: 9500, sale: 13500 },
      { label: 'Thùng 24 gói', cost: 144000, sale: 195000 },
      { label: 'Combo 5 gói', cost: 30000, sale: 42000 },
    ],
  },
  {
    categoryId: 'cat-6',
    name: 'Cháo ăn liền Cầu Tre',
    unit: 'gói',
    taxRate: 0.1,
    variants: [
      { label: 'Gói 50g', cost: 7000, sale: 10000 },
      { label: 'Ly 40g', cost: 8500, sale: 12000 },
      { label: 'Thùng 24 gói', cost: 156000, sale: 210000 },
      { label: 'Combo 4 gói', cost: 26000, sale: 36000 },
    ],
  },
  {
    categoryId: 'cat-7',
    name: 'Nước rửa chén Sunlight',
    unit: 'chai',
    taxRate: 0.1,
    variants: [
      { label: 'Chai 400g', cost: 15000, sale: 21000 },
      { label: 'Chai 750g', cost: 26000, sale: 36000 },
      { label: 'Túi 3.6kg', cost: 105000, sale: 142000 },
      { label: 'Chai 1.5kg', cost: 48000, sale: 65000 },
    ],
  },
  {
    categoryId: 'cat-7',
    name: 'Bột giặt Omo',
    unit: 'gói',
    taxRate: 0.1,
    variants: [
      { label: 'Gói 400g', cost: 22000, sale: 30000 },
      { label: 'Gói 800g', cost: 42000, sale: 57000 },
      { label: 'Túi 3kg', cost: 138000, sale: 185000 },
      { label: 'Túi 6kg', cost: 265000, sale: 355000 },
    ],
  },
  {
    categoryId: 'cat-7',
    name: 'Nước xả vải Comfort',
    unit: 'chai',
    taxRate: 0.1,
    variants: [
      { label: 'Túi 800ml', cost: 28000, sale: 39000 },
      { label: 'Túi 1.6L', cost: 52000, sale: 71000 },
      { label: 'Chai 3.4L', cost: 105000, sale: 142000 },
      { label: 'Túi 400ml', cost: 16000, sale: 22000 },
    ],
  },
  {
    categoryId: 'cat-8',
    name: 'Kem đánh răng P/S',
    unit: 'tuýp',
    taxRate: 0.1,
    variants: [
      { label: 'Tuýp 100g', cost: 9500, sale: 14000 },
      { label: 'Tuýp 180g', cost: 16000, sale: 23000 },
      { label: 'Combo 2 tuýp', cost: 18000, sale: 26000 },
      { label: 'Tuýp 230g', cost: 21000, sale: 29000 },
    ],
  },
  {
    categoryId: 'cat-8',
    name: 'Dầu gội Clear',
    unit: 'chai',
    taxRate: 0.1,
    variants: [
      { label: 'Chai 170g', cost: 28000, sale: 39000 },
      { label: 'Chai 370g', cost: 55000, sale: 75000 },
      { label: 'Túi 6ml x12', cost: 12000, sale: 17000 },
      { label: 'Chai 640g', cost: 92000, sale: 125000 },
    ],
  },
];

/**
 * Product photos bundled under `assets/products/`. Keyed by the template name so every
 * size/pack variant of a base product shares one picture; sources and licences are listed in
 * `docs/design/image-credits.md`.
 */
const TEMPLATE_IMAGES: Record<string, number> = {
  'Nước ngọt Coca-Cola': require('../../../assets/products/coca-cola.jpg'),
  'Bia Saigon': require('../../../assets/products/bia-saigon.jpg'),
  'Cà phê hoà tan G7': require('../../../assets/products/ca-phe-g7.jpg'),
  'Sữa tươi Vinamilk': require('../../../assets/products/sua-vinamilk.jpg'),
  'Sữa đặc Ông Thọ': require('../../../assets/products/sua-dac-ong-tho.jpg'),
  'Sữa chua Vinamilk': require('../../../assets/products/sua-chua-vinamilk.jpg'),
  'Phô mai con bò cười': require('../../../assets/products/pho-mai-con-bo-cuoi.jpg'),
  'Gạo Jasmine': require('../../../assets/products/gao-jasmine.jpg'),
  'Yến mạch Quaker': require('../../../assets/products/yen-mach-quaker.jpg'),
  'Nước mắm Phú Quốc': require('../../../assets/products/nuoc-mam-phu-quoc.jpg'),
  'Nước tương Maggi': require('../../../assets/products/nuoc-tuong-maggi.jpg'),
  'Bột ngọt Ajinomoto': require('../../../assets/products/bot-ngot-ajinomoto.jpg'),
  'Bánh Oreo': require('../../../assets/products/banh-oreo.jpg'),
  'Kẹo Alpenliebe': require('../../../assets/products/keo-alpenliebe.jpg'),
  'Snack Oishi': require('../../../assets/products/snack-oishi.jpg'),
  'Chocopie Orion': require('../../../assets/products/chocopie-orion.jpg'),
  'Mì Hảo Hảo': require('../../../assets/products/mi-hao-hao.jpg'),
  'Mì Omachi': require('../../../assets/products/mi-omachi.jpg'),
  'Phở ăn liền Vifon': require('../../../assets/products/pho-vifon.jpg'),
  'Nước rửa chén Sunlight': require('../../../assets/products/nuoc-rua-chen-sunlight.jpg'),
  'Bột giặt Omo': require('../../../assets/products/bot-giat-omo.jpg'),
  'Nước xả vải Comfort': require('../../../assets/products/nuoc-xa-comfort.jpg'),
  'Dầu gội Clear': require('../../../assets/products/dau-goi-clear.jpg'),
};

/**
 * One generic grocery photo per category, used when a template has no picture of its own.
 * Drinks have no generic photo on purpose: every free stock shot of a soft drink shows a brand,
 * and a Coca-Cola bottle on a green-tea tile misleads the cashier, so those fall back to the monogram.
 */
const CATEGORY_IMAGES: Record<string, number> = {
  'cat-2': require('../../../assets/products/category-sua.jpg'),
  'cat-3': require('../../../assets/products/category-gao.jpg'),
  'cat-4': require('../../../assets/products/category-gia-vi.jpg'),
  'cat-5': require('../../../assets/products/category-banh-keo.jpg'),
  'cat-6': require('../../../assets/products/category-mi-an-lien.jpg'),
  'cat-7': require('../../../assets/products/category-hoa-pham.jpg'),
  'cat-8': require('../../../assets/products/category-ve-sinh.jpg'),
};

/**
 * SKUs deliberately left without a photo so the tile's monogram fallback stays visible in the
 * grid, in the cart line and in the orders preview. A real catalogue always has gaps.
 */
const SKUS_WITHOUT_IMAGE = new Set([
  'DU-003',
  'DU-011',
  'SU-006',
  'GO-005',
  'GV-009',
  'BK-004',
  'MI-010',
  'HP-002',
  'VS-007',
  'VS-003',
]);

function imageFor(templateName: string, categoryId: string, sku: string): number | undefined {
  if (SKUS_WITHOUT_IMAGE.has(sku)) return undefined;
  return TEMPLATE_IMAGES[templateName] ?? CATEGORY_IMAGES[categoryId];
}

const CATEGORY_PREFIX: Record<string, string> = {
  'cat-1': 'DU',
  'cat-2': 'SU',
  'cat-3': 'GO',
  'cat-4': 'GV',
  'cat-5': 'BK',
  'cat-6': 'MI',
  'cat-7': 'HP',
  'cat-8': 'VS',
};

function buildProducts(): Product[] {
  const products: Product[] = [];
  let sequence = 1;
  const skuCounters: Record<string, number> = {};

  for (const template of TEMPLATES) {
    for (const variant of template.variants) {
      const prefix = CATEGORY_PREFIX[template.categoryId] ?? 'SP';
      const counter = (skuCounters[prefix] ?? 0) + 1;
      skuCounters[prefix] = counter;
      const sku = `${prefix}-${String(counter).padStart(3, '0')}`;
      products.push({
        id: `product-${sequence}`,
        sku,
        barcode: ean13(String(893000000000 + sequence).slice(0, 12)),
        name: `${template.name} ${variant.label}`,
        categoryId: template.categoryId,
        variantLabel: variant.label,
        unit: template.unit,
        costPrice: variant.cost,
        salePrice: variant.sale,
        taxRate: template.taxRate,
        imageUrl: imageFor(template.name, template.categoryId, sku),
        isActive: true,
      });
      sequence += 1;
    }
  }
  return products;
}

export const products: Product[] = buildProducts();
