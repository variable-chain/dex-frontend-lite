import { atom } from 'jotai';
import { Address } from 'viem';

import { getTradesHistory } from 'network/history';
import { perpetualsAtom } from 'store/pools.store';

import { UnrealizedPnLListAtomI } from './fetchUnrealizedPnL';

export const realizedPnLListAtom = atom<UnrealizedPnLListAtomI[]>([]);

export const fetchRealizedPnLAtom = atom(null, async (get, set, userAddress: Address, chainId: number) => {
  const perpetuals = get(perpetualsAtom);

  const tradeHistory = await getTradesHistory(chainId, userAddress);
  const realizedPnLReduced = tradeHistory.reduce<Record<string, number>>((acc, current) => {
    const poolName = perpetuals.find(({ id }) => id === current.perpetualId)?.poolName || '';
    if (acc[poolName]) {
      acc[poolName] += current.realizedPnl;
    } else {
      acc[poolName] = current.realizedPnl;
    }
    return acc;
  }, {});
  set(
    realizedPnLListAtom,
    Object.keys(realizedPnLReduced).map((key) => ({
      symbol: key,
      value: realizedPnLReduced[key],
    }))
  );
});
