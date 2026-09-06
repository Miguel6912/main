import { useCallback, useEffect, useState } from 'react';
import { getAppMeta, updateAppMeta } from '../../storage/metaStore';
import type { AppMeta } from '../../storage/schema';

export function useAppMeta() {
  const [meta, setMeta] = useState<AppMeta | null>(null);

  const refresh = useCallback(async () => {
    setMeta(await getAppMeta());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const patch = useCallback(async (p: Partial<Omit<AppMeta, 'key'>>) => {
    const updated = await updateAppMeta(p);
    setMeta(updated);
  }, []);

  return { meta, refresh, patch };
}
