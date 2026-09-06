import { useEffect, useState } from 'react';
import { getAllLedgerItems } from '../../storage/ledgerStore';
import { getWorkingKnowledgeSummary } from '../../features/ledger/ledgerService';
import type { LedgerItem } from '../../types/ledger';

export interface WorkingKnowledgeData {
  introduced: number;
  reliable: number;
  automatic: number;
  weakPoints: LedgerItem[];
}

export function useWorkingKnowledge(refreshKey?: unknown): WorkingKnowledgeData | null {
  const [data, setData] = useState<WorkingKnowledgeData | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [summary, all] = await Promise.all([getWorkingKnowledgeSummary(), getAllLedgerItems()]);
      if (cancelled) return;
      const weakPoints = all
        .filter((i) => i.status !== 'LOCKED' && i.retrievalAttempts > 0)
        .sort((a, b) => a.automaticityScore - b.automaticityScore)
        .slice(0, 3);
      setData({ ...summary, weakPoints });
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  return data;
}
