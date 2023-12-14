import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';

import { getCodeRebate, getMyCodeSelection } from 'network/referral';

export const useFetchCodeAndRebate = () => {
  const chainId = useChainId();
  const { address } = useAccount();

  const [activeCode, setActiveCode] = useState('');
  const [rebateRate, setRebateRate] = useState(0);

  const activeCodeRequestRef = useRef(false);
  const rebateRateRequestRef = useRef(false);

  const fetchMyCodeSelection = useCallback(() => {
    if (!chainId || !address) {
      return;
    }

    activeCodeRequestRef.current = true;

    getMyCodeSelection(chainId, address)
      .then(({ data }) => setActiveCode(data))
      .catch(console.error)
      .finally(() => {
        activeCodeRequestRef.current = false;
      });
  }, [chainId, address]);

  useEffect(() => {
    if (activeCodeRequestRef.current) {
      return;
    }
    fetchMyCodeSelection();
  }, [fetchMyCodeSelection]);

  const fetchCodeRebate = useCallback(() => {
    if (!chainId || !activeCode) {
      return;
    }

    rebateRateRequestRef.current = true;

    getCodeRebate(chainId, activeCode)
      .then(({ data }) => setRebateRate(data.rebate_percent))
      .catch(console.error)
      .finally(() => {
        rebateRateRequestRef.current = false;
      });
  }, [activeCode, chainId]);

  useEffect(() => {
    if (rebateRateRequestRef.current) {
      return;
    }
    fetchCodeRebate();
  }, [fetchCodeRebate]);

  const fetchCodeAndRebate = useCallback(() => {
    fetchMyCodeSelection();
    fetchCodeRebate();
  }, [fetchMyCodeSelection, fetchCodeRebate]);

  return {
    activeCode,
    rebateRate,
    fetchCodeAndRebate,
  };
};
