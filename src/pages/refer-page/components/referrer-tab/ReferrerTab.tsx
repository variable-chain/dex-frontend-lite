import { useAtom } from 'jotai';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { Box } from '@mui/material';

import { poolsAtom } from 'store/pools.store';
import { commissionRateAtom } from 'store/refer.store';
import type { OverviewItemI, OverviewPoolItemI } from 'types/types';

import { Disclaimer } from '../disclaimer/Disclaimer';
import { Overview } from '../overview/Overview';
import { ReferralsBlock } from '../referrals-block/ReferralsBlock';
import { useFetchEarnedRebate } from './useFetchEarnedRebate';

import styles from './ReferrerTab.module.scss';

export const ReferrerTab = memo(() => {
  const { t } = useTranslation();

  const [pools] = useAtom(poolsAtom);
  const [commissionRate] = useAtom(commissionRateAtom);

  const { address } = useAccount();

  const disclaimerTextBlocks = useMemo(
    () => [t('pages.refer.referrer-tab.disclaimer-text-block1'), t('pages.refer.referrer-tab.disclaimer-text-block2')],
    [t]
  );

  const { earnedRebates } = useFetchEarnedRebate();

  const overviewItems: OverviewItemI[] = useMemo(() => {
    const totalEarnedCommission: OverviewPoolItemI[] = [];

    pools.forEach((pool) => {
      const earnedCommissionAmount = earnedRebates
        .filter((rebate) => !rebate.asTrader && rebate.poolId === pool.poolId)
        .reduce((accumulator, currentValue) => accumulator + currentValue.earnings, 0);

      totalEarnedCommission.push({ symbol: pool.poolSymbol, value: earnedCommissionAmount });
    });

    return [
      {
        title: t('pages.refer.referrer-tab.total-earned-commission'),
        poolsItems: address ? totalEarnedCommission : [],
      },
      {
        title: t('pages.refer.referrer-tab.commission-rate'),
        poolsItems: address
          ? [
              {
                value: `${commissionRate}%`,
                symbol: '',
              },
            ]
          : [],
      },
    ];
  }, [pools, commissionRate, earnedRebates, address, t]);

  return (
    <Box className={styles.root}>
      <Overview title={t('pages.refer.referrer-tab.title1')} items={overviewItems} />
      <Disclaimer title={t('pages.refer.referrer-tab.title2')} textBlocks={disclaimerTextBlocks} />
      <div className={styles.divider} />
      <ReferralsBlock />
    </Box>
  );
});
