import { DisclaimerComponent } from '@rainbow-me/rainbowkit';

export const Disclaimer: DisclaimerComponent = ({ Text, Link }) => (
  <Text>
    By connecting your wallet, you agree to the <Link href="https://termsofservice.xyz">Terms of Service</Link> and
    acknowledge you have read and understand the protocol <Link href="https://disclaimer.xyz">Disclaimer</Link>
  </Text>
);
