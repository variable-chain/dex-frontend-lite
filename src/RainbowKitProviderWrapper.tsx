import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { useAtom } from 'jotai';
import { ReactNode } from 'react';

import { chains } from 'blockchain-api/wagmi/wagmiClient';
import { Disclaimer } from 'components/disclaimer/disclaimer';

import '@rainbow-me/rainbowkit/styles.css';
import { enabledDarkModeAtom } from 'store/app.store';

export const RainbowKitProviderWrapper = ({ children }: { children: ReactNode }) => {
  const [enabledDarkMode] = useAtom(enabledDarkModeAtom);

  return (
    <RainbowKitProvider
      chains={chains}
      appInfo={{ appName: 'Variable', disclaimer: Disclaimer, learnMoreUrl: 'https://variable.exchange/' }}
      modalSize="compact"
      theme={enabledDarkMode ? darkTheme() : undefined}
    >
      {children}
    </RainbowKitProvider>
  );
};
