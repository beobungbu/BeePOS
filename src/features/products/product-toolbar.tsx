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
import { Toolbar } from '../../components/toolbar';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import type { Category } from '../../domain/types';
import { useT } from '../../i18n';
import type { ProductFilters, ProductStatusFilter } from './product-list-utils';

interface ProductToolbarProps {
  filters: ProductFilters;
  categories: Category[];
  onFiltersChange: (filters: ProductFilters) => void;
  /** Primary actions; desktop pins them to the right of the same row. */
  actions?: React.ReactNode;
}

/** Filters on the left, the two page actions on the right, one row from 1280 up. */
export function ProductToolbar({ filters, categories, onFiltersChange, actions }: ProductToolbarProps) {
  const t = useT();
  // One row only on desktop: at 768 the search field, the category select and the three
  // status segments together leave the search box too narrow to read its own placeholder.
  const isDesktop = useBreakpoint() === 'desktop';

  const fields = (
    <>
      <View className={isDesktop ? 'min-w-64 flex-1' : ''}>
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
    </>
  );

  if (isDesktop) {
    return <Toolbar actions={actions}>{fields}</Toolbar>;
  }

  return (
    <View className="gap-3">
      {fields}
      {actions ? <View className="flex-row flex-wrap items-center gap-2">{actions}</View> : null}
    </View>
  );
}
