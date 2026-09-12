import {
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
import { useBreakpoint } from '../../hooks/use-breakpoint';
import type { Category } from '../../domain/types';
import { useT } from '../../i18n';
import type { ProductFilters, ProductStatusFilter } from './product-list-utils';

interface ProductToolbarProps {
  filters: ProductFilters;
  categories: Category[];
  onFiltersChange: (filters: ProductFilters) => void;
}

/** Filter row only; the page actions live in the screen header, as the mockups show. */
export function ProductToolbar({ filters, categories, onFiltersChange }: ProductToolbarProps) {
  const t = useT();
  // One row only on desktop: at 768 the search field, the category select and the three
  // status segments together leave the search box too narrow to read its own placeholder.
  const isDesktop = useBreakpoint() === 'desktop';

  return (
    <View className={isDesktop ? 'flex-row items-center gap-3' : 'gap-3'}>
      <View className={isDesktop ? 'flex-1' : ''}>
        <SearchInput
          placeholder={t('products.searchPlaceholder')}
          defaultValue={filters.search}
          onChangeText={(value) => onFiltersChange({ ...filters, search: value })}
          onSearch={(value) => onFiltersChange({ ...filters, search: value })}
        />
      </View>
      <View className={isDesktop ? 'w-56' : ''}>
        <Select
          value={filters.categoryId}
          onValueChange={(value) => onFiltersChange({ ...filters, categoryId: value })}
        >
          <SelectTrigger accessibilityLabel={t('products.columns.category')}>
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
        // Hugging the row squeezes "Đang bán" onto two lines; the floor keeps one line.
        className={isDesktop ? 'min-w-80 shrink-0' : ''}
        value={filters.status}
        onValueChange={(value) => onFiltersChange({ ...filters, status: value as ProductStatusFilter })}
      >
        <SegmentedControlItem value="all">{t('products.statusAll')}</SegmentedControlItem>
        <SegmentedControlItem value="active">{t('products.statusActive')}</SegmentedControlItem>
        <SegmentedControlItem value="inactive">{t('products.statusInactive')}</SegmentedControlItem>
      </SegmentedControl>
    </View>
  );
}
