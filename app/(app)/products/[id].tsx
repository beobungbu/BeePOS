import { useLocalSearchParams } from 'expo-router';
import { ProductFormScreen } from '../../../src/features/products/product-form-screen';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProductFormScreen productId={id} />;
}
