import {
  Button,
  SearchInput,
  SegmentedControl,
  SegmentedControlItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@beemvp/beeui-ui';
import { View } from 'react-native';
import type { Category } from '../../domain/types';
import { useT } from '../../i18n';
import { useIsWide } from './hooks/use-is-wide';
import type { ProductFilters, ProductStatusFilter } from './product-list-utils';

interface ProductToolbarProps {
  filters: ProductFilters;
  categories: Category[];
  onFiltersChange: (filters: ProductFilters) => void;
  onAddProduct: () => void;
}

export function ProductToolbar({ filters, categories, onFiltersChange, onAddProduct }: ProductToolbarProps) {
  const t = useT();
  const isWide = useIsWide();

  return (
    <View className={isWide ? 'flex-row items-center gap-3' : 'gap-3'}>
      <View className={isWide ? 'flex-1' : ''}>
        <SearchInput
          placeholder={t('products.searchPlaceholder')}
          defaultValue={filters.search}
          onChangeText={(value) => onFiltersChange({ ...filters, search: value })}
          onSearch={(value) => onFiltersChange({ ...filters, search: value })}
        />
      </View>
      <View className={isWide ? 'w-56' : ''}>
        <Select
          value={filters.categoryId}
          onValueChange={(value) => onFiltersChange({ ...filters, categoryId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('products.categoryAll')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" textValue={t('products.categoryAll')}>
              {t('products.categoryAll')}
            </SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id} textValue={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </View>
      <SegmentedControl
        value={filters.status}
        onValueChange={(value) => onFiltersChange({ ...filters, status: value as ProductStatusFilter })}
      >
        <SegmentedControlItem value="all">{t('products.statusAll')}</SegmentedControlItem>
        <SegmentedControlItem value="active">{t('products.statusActive')}</SegmentedControlItem>
        <SegmentedControlItem value="inactive">{t('products.statusInactive')}</SegmentedControlItem>
      </SegmentedControl>
      <Button onPress={onAddProduct}>{t('products.addProduct')}</Button>
    </View>
  );
}
