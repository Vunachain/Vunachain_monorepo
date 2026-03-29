import { type Address } from 'viem';

// cUSD Token Address on Celo Alfajores
export const cUSD_ADDRESS: Address = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1';

/**
 * Provides transaction overrides for Celo MiniPay.
 * Ensures gas is paid in cUSD if the user is in a MiniPay environment.
 */
export const getCeloOverrides = (isMiniPay: boolean) => {
    interface Window {
        dataLayer: Record<string, unknown>[];
    }
    if (isMiniPay) {
        return {
            feeCurrency: cUSD_ADDRESS,
        };
    }
    return {};
};

/**
 * Example function to structure a blockchain transaction call
 */
export const structureTransaction = (config: Record<string, unknown>, isMiniPay: boolean) => {
    return {
        ...config,
        overrides: getCeloOverrides(isMiniPay),
    };
};
