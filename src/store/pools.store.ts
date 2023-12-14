import { TraderInterface } from '@d8x/perpetuals-sdk';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import type {
  FundingI,
  MarginAccountI,
  OrderI,
  OrderWithIdI,
  PerpetualDataI,
  PerpetualOpenOrdersI,
  PerpetualStaticInfoI,
  PerpetualStatisticsI,
  PoolWithIdI,
  TradeHistoryI,
} from 'types/types';

const SHOW_CHART_FOR_MOBILE_LS_KEY = 'd8x_showChartForMobile';

export const traderAPIAtom = atom<TraderInterface | null>(null);
export const traderAPIBusyAtom = atom(false);
export const poolsAtom = atom<PoolWithIdI[]>([]);
export const perpetualsAtom = atom<PerpetualDataI[]>([]);
export const poolFeeAtom = atom<number | undefined>(undefined);
export const oracleFactoryAddrAtom = atom('');
export const proxyAddrAtom = atom<string | undefined>(undefined);
export const perpetualStatisticsAtom = atom<PerpetualStatisticsI | null>(null);
export const perpetualStaticInfoAtom = atom<PerpetualStaticInfoI | null>(null);
export const newPositionRiskAtom = atom<MarginAccountI | null>(null);
export const collateralDepositAtom = atom(0);
export const webSocketReadyAtom = atom(false);
export const mainWsLatestMessageTimeAtom = atom(Date.now());
export const loyaltyScoreAtom = atom(0);
export const proxyABIAtom = atom<string[] | undefined>(undefined);
export const poolTokenBalanceAtom = atom<number | undefined>(undefined);
export const poolTokenDecimalsAtom = atom<number | undefined>(undefined);
export const tradesHistoryAtom = atom<TradeHistoryI[]>([]);
export const fundingListAtom = atom<FundingI[]>([]);

const perpetualsStatsAtom = atom<Record<string, MarginAccountI>>({});
const allPerpetualStatisticsPrimitiveAtom = atom<Record<string, PerpetualStatisticsI>>({});
export const allPerpetualStatisticsAtom = atom(null, (_get, set, updates: Record<string, PerpetualStatisticsI>) => {
  set(allPerpetualStatisticsPrimitiveAtom, (prev) => ({
    ...prev,
    ...updates,
  }));
});
const ordersAtom = atom<Record<string, OrderI>>({});

const selectedPoolNameAtom = atom('');
const showChartForMobileLSAtom = atomWithStorage(SHOW_CHART_FOR_MOBILE_LS_KEY, false);

export const showChartForMobileAtom = atom(
  (get) => {
    const isShown = get(showChartForMobileLSAtom);
    if (!isShown) {
      return false;
    }
    return isShown;
  },
  (_get, set, isShown: boolean) => {
    set(showChartForMobileLSAtom, isShown);
  }
);

export const selectedPoolAtom = atom(
  (get) => {
    const allPools = get(poolsAtom);
    if (allPools.length === 0) {
      return null;
    }

    const savedPoolName = get(selectedPoolNameAtom);
    const foundPool = allPools.find((pool) => pool.poolSymbol === savedPoolName);
    if (foundPool) {
      return foundPool;
    }

    return allPools[0];
  },
  (_get, set, newPool: string) => {
    set(selectedPoolNameAtom, newPool);
    // Clear data about previous stats and orders
    // set(perpetualsStatsAtom, {});
    // set(ordersAtom, {});
  }
);

const selectedPerpetualIdAtom = atom(0);

export const selectedPerpetualAtom = atom(
  (get) => {
    const selectedPool = get(selectedPoolAtom);
    if (!selectedPool) {
      return null;
    }

    const perpetuals = selectedPool.perpetuals;
    if (perpetuals.length === 0) {
      return null;
    }

    const savedPerpetualId = get(selectedPerpetualIdAtom);
    const foundPerpetual = perpetuals.find((perpetual) => perpetual.id === +savedPerpetualId);
    if (foundPerpetual) {
      return foundPerpetual;
    }

    return perpetuals[0];
  },
  (_get, set, perpetualId: number) => {
    set(selectedPerpetualIdAtom, perpetualId);
  }
);

export const positionsAtom = atom(
  (get) => {
    const perpetualsStats = get(perpetualsStatsAtom);

    const stats = get(allPerpetualStatisticsPrimitiveAtom);
    const pools = get(poolsAtom);

    return Object.values(perpetualsStats)
      .filter(({ side }) => side !== 'CLOSED')
      .map((position) => {
        const positionStats = stats[position.symbol];
        const markPrice = positionStats?.markPrice;
        if (!positionStats || !markPrice) {
          return position;
        }

        const collToQuoteIndexPrice = pools
          .find((pool) => pool.poolSymbol === positionStats.poolName)
          ?.perpetuals.find(
            (perpetual) =>
              perpetual.baseCurrency === positionStats.baseCurrency &&
              perpetual.quoteCurrency === positionStats.quoteCurrency
          )?.collToQuoteIndexPrice;

        if (!collToQuoteIndexPrice) {
          return position;
        }

        let unrealizedPnL;
        if (position.side === 'BUY') {
          unrealizedPnL =
            position.positionNotionalBaseCCY * (markPrice - position.entryPrice) +
            position.unrealizedFundingCollateralCCY * collToQuoteIndexPrice;
        } else {
          unrealizedPnL =
            -position.positionNotionalBaseCCY * (markPrice - position.entryPrice) +
            position.unrealizedFundingCollateralCCY * collToQuoteIndexPrice;
        }

        position.unrealizedPnlQuoteCCY = unrealizedPnL;

        return position;
      });
  },
  (_get, set, position: MarginAccountI) => {
    set(perpetualsStatsAtom, (prev) => ({
      ...prev,
      [position.symbol]: position,
    }));
  }
);

export const openOrdersAtom = atom(
  (get): OrderWithIdI[] => {
    const orders = get(ordersAtom);
    return Object.entries(orders).map(([key, value]) => ({ id: key, ...value }));
  },
  (_get, set, openOrders: PerpetualOpenOrdersI) => {
    set(ordersAtom, (prev) => {
      const updatedOpenOrders = { ...prev };
      openOrders.orderIds?.forEach((orderId, index) => (updatedOpenOrders[orderId] = openOrders.orders[index]));
      return updatedOpenOrders;
    });
  }
);

export const removeOpenOrderAtom = atom(null, (_get, set, orderIdToRemove: string) => {
  set(ordersAtom, (prev) => {
    const updatedOpenOrders = { ...prev };
    delete updatedOpenOrders[orderIdToRemove];
    return updatedOpenOrders;
  });
});

export const removePositionAtom = atom(null, (_get, set, symbolToRemove: string) => {
  set(perpetualsStatsAtom, (prev) => {
    const perpetualsStats = { ...prev };
    delete perpetualsStats[symbolToRemove];
    return perpetualsStats;
  });
});

export const failOrderAtom = atom(null, (_get, set, orderIdToUpdate: string) => {
  set(ordersAtom, (prev) => {
    const updatedOpenOrders = { ...prev };
    delete updatedOpenOrders[orderIdToUpdate];
    return updatedOpenOrders;
  });
});

export const clearOpenOrdersAtom = atom(null, (_get, set) => {
  set(ordersAtom, {});
});
