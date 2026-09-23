import { useState, useCallback } from 'react';

import { createProduct } from '../services/productService';
import type { ProductDto, ProductResponseDto } from '../types/dto';

/**
 * Hook for creating a new product with loading and error state management
 *
 * Features:
 * - Loading state tracking
 * - Error handling with user-friendly messages
 * - Optimistic UI support (WatermelonDB observables)
 * - Works offline
 *
 * @returns Object with createProduct function, loading state, error, and reset
 *
 * @example
 * const { createProduct: handleCreate, isLoading, error } = useCreateProduct();
 *
 * const onSubmit = async (data: ProductDto) => {
 *   const product = await handleCreate(data);
 *   if (product) {
 *     navigation.goBack();
 *   }
 * };
 */
export const useCreateProduct = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateProduct = useCallback(
    async (data: ProductDto): Promise<ProductResponseDto | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const product = await createProduct(data);

        return product;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : t('errorCreateFailed');
        setError(errorMessage);
        console.error('Error creating product:', err);
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
    createProduct: handleCreateProduct,
    isLoading,
    error,
    reset,
  };
};
