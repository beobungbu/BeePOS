import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  Field,
  Input,
  Text,
  useToast,
} from '@beemvp/beeui-ui';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useCatalogStore } from '../../data/catalog-store';
import type { Category } from '../../domain/types';
import { useT } from '../../i18n';

type DialogMode = 'add' | 'addSub' | 'rename' | 'delete';

interface DialogState {
  mode: DialogMode;
  target?: Category;
}

function makeCategoryId(): string {
  return `category-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function CategoriesScreen() {
  const t = useT();
  const toast = useToast();
  const categories = useCatalogStore((state) => state.categories);
  const products = useCatalogStore((state) => state.products);
  const upsertCategory = useCatalogStore((state) => state.upsertCategory);
  const removeCategory = useCatalogStore((state) => state.removeCategory);

  const [openValue, setOpenValue] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [nameInput, setNameInput] = useState('');

  const topLevel = useMemo(() => categories.filter((category) => !category.parentId), [categories]);
  const childrenOf = (parentId: string) => categories.filter((category) => category.parentId === parentId);
  const productCount = (categoryId: string) =>
    products.filter((product) => product.categoryId === categoryId).length;

  function openDialog(mode: DialogMode, target?: Category) {
    setNameInput(mode === 'rename' && target ? target.name : '');
    setDialog({ mode, target });
  }

  function closeDialog() {
    setDialog(null);
    setNameInput('');
  }

  function confirmDialog() {
    if (!dialog) return;
    if (dialog.mode === 'delete' && dialog.target) {
      removeCategory(dialog.target.id);
      toast.show({ title: t('products.categories.delete'), variant: 'success' });
    } else if (dialog.mode === 'rename' && dialog.target && nameInput.trim()) {
      upsertCategory({ ...dialog.target, name: nameInput.trim() });
      toast.show({ title: t('products.categories.rename'), variant: 'success' });
    } else if (dialog.mode === 'add' && nameInput.trim()) {
      upsertCategory({ id: makeCategoryId(), name: nameInput.trim() });
      toast.show({ title: t('products.categories.addCategory'), variant: 'success' });
    } else if (dialog.mode === 'addSub' && dialog.target && nameInput.trim()) {
      upsertCategory({ id: makeCategoryId(), name: nameInput.trim(), parentId: dialog.target.id });
      toast.show({ title: t('products.categories.addSubcategory'), variant: 'success' });
    }
    closeDialog();
  }

  function renderActions(category: Category, includeAddSub: boolean) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger variant="outline" size="sm">
          {t('common.actions.edit')}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {includeAddSub && (
            <DropdownMenuItem onSelect={() => openDialog('addSub', category)}>
              {t('products.categories.addSubcategory')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => openDialog('rename', category)}>
            {t('products.categories.rename')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => openDialog('delete', category)}>
            {t('products.categories.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const dialogTitle =
    dialog?.mode === 'delete'
      ? t('products.categories.dialogDeleteTitle')
      : dialog?.mode === 'rename'
        ? t('products.categories.dialogRenameTitle')
        : t('products.categories.dialogAddTitle');

  return (
    <View className="flex-1 gap-4 p-4">
      <View className="flex-row items-center justify-between">
        <Text variant="title">{t('products.categories.title')}</Text>
        <Button onPress={() => openDialog('add')}>{t('products.categories.addCategory')}</Button>
      </View>

      {topLevel.length === 0 ? (
        <EmptyState title={t('products.emptyTitle')} description={t('products.emptyDescription')} />
      ) : (
        <Accordion collapsible value={openValue} onValueChange={setOpenValue}>
          {topLevel.map((category) => (
            <AccordionItem key={category.id} value={category.id}>
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-1">
                  <AccordionTrigger>
                    <Text>{`${category.name} · ${productCount(category.id)} ${t('products.categories.productsSuffix')}`}</Text>
                  </AccordionTrigger>
                </View>
                {renderActions(category, true)}
              </View>
              <AccordionContent className="gap-2 pl-6">
                {childrenOf(category.id).map((child) => (
                  <View key={child.id} className="flex-row items-center justify-between gap-2 py-1">
                    <Text>{`${child.name} · ${productCount(child.id)} ${t('products.categories.productsSuffix')}`}</Text>
                    {renderActions(child, false)}
                  </View>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogTitle>{dialogTitle}</DialogTitle>
          {dialog?.mode === 'delete' ? (
            <DialogDescription>{t('products.categories.dialogDeleteDescription')}</DialogDescription>
          ) : (
            <Field label={t('products.categories.nameLabel')} required>
              <Input value={nameInput} onChangeText={setNameInput} />
            </Field>
          )}
          <DialogFooter>
            <Button variant="outline" onPress={closeDialog}>
              {t('common.actions.cancel')}
            </Button>
            <Button variant={dialog?.mode === 'delete' ? 'destructive' : 'primary'} onPress={confirmDialog}>
              {t('common.actions.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  );
}
