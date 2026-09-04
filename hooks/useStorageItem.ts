import { useState, useEffect, useCallback } from 'react';
import { isExtensionContextInvalidated } from '@/lib/shared/extension-context';

export type StorageItem<T> = {
  getValue(): Promise<T>;
  setValue(value: T): Promise<void>;
  watch(cb: (newValue: T, oldValue: T) => void): () => void;
};

export function useStorageItem<T>(item: StorageItem<T>, fallback: T): [T, (value: T) => Promise<void>] {
  const [value, setValueState] = useState<T>(fallback);

  useEffect(() => {
    let mounted = true;
    item.getValue()
      .then((val) => {
        if (mounted) setValueState(val);
      })
      .catch((err) => {
        if (!isExtensionContextInvalidated(err)) {
          console.warn('[storage] getValue failed:', err);
        }
      });
    const unwatch = item.watch((newVal) => {
      if (mounted) setValueState(newVal);
    });
    return () => {
      mounted = false;
      try {
        unwatch();
      } catch {
        /* 扩展重载后 watch 可能已失效 */
      }
    };
  }, [item]);

  const setValue = useCallback(
    async (newValue: T) => {
      setValueState(newValue);
      await item.setValue(newValue);
    },
    [item],
  );

  return [value, setValue];
}
