import { useState, useCallback } from 'react';

import { updateProductWithVariants } from '../services/productService';
import type { ProductDto, ProductResponseDto } from '../types/dto';

/**
 * Hook for updating an existing product with loading and error state management
 *
 * Features:
 * - Loading state tracking
 * - Error handling with user-friendly messages
 * - Optimistic UI support (WatermelonDB observables)
 * - Works offline
 *
 * @returns Object with updateProduct function, loading state, error, and reset
 *
 * @example
 * const { updateProduct, isLoading, error } = useEditProduct();
 *
 * const onSubmit = async (data: ProductDto) => {
 *   const product = await updateProduct(productId, data);
 *   if (product) {
 *     navigation.goBack();
 *   }
 * };
 */
export const useEditProduct = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateProduct = useCallback(
    async (
      productId: string,
      data: ProductDto
    ): Promise<ProductResponseDto | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const product = await updateProductWithVariants(productId, data);

        return product;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : t('errorUpdateFailed');
        setError(errorMessage);
        console.error('Error updating product:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    updateProduct: handleUpdateProduct,
    isLoading,
    error,
    reset,
  };
};
