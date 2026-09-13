import type { Category } from '../../domain/types';
import { DEMO_ORG_ID } from './org';

export const categories: Category[] = [
  { id: 'cat-1', orgId: DEMO_ORG_ID, name: 'Đồ uống' },
  { id: 'cat-2', orgId: DEMO_ORG_ID, name: 'Sữa và chế phẩm' },
  { id: 'cat-3', orgId: DEMO_ORG_ID, name: 'Gạo và ngũ cốc' },
  { id: 'cat-4', orgId: DEMO_ORG_ID, name: 'Gia vị' },
  { id: 'cat-5', orgId: DEMO_ORG_ID, name: 'Bánh kẹo' },
  { id: 'cat-6', orgId: DEMO_ORG_ID, name: 'Mì và thực phẩm ăn liền' },
  { id: 'cat-7', orgId: DEMO_ORG_ID, name: 'Hoá phẩm gia dụng' },
  { id: 'cat-8', orgId: DEMO_ORG_ID, name: 'Đồ vệ sinh cá nhân' },
];
