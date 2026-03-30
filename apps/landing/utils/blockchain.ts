import { type Address } from 'viem';

// USDC Token Address on Ethereum Sepolia Testnet
// Address: 0x6f14C02d3c0EeD86e1f5d8bE8d1eEfD3E4f6e4e7 (example, should be verified)
export const USDC_ADDRESS: Address = '0x6f14C02d3c0EeD86e1f5d8bE8d1eEfD3E4f6e4e7';

/**
 * Provides transaction overrides for Sepolia testnet.
 * Uses standard Ethereum transaction parameters.
 */
export const getSepoliaOverrides = () => {
    interface Window {
        dataLayer: Record<string, unknown>[];
    }
    return {
        // Standard Sepolia transaction configuration
        // Adjust gas limits as needed for your contract
    };
};

/**
 * Example function to structure a blockchain transaction call
 */
export const structureTransaction = (config: Record<string, unknown>) => {
    return {
        ...config,
        // Standard Ethereum transaction parameters
        // Add overrides as needed for gas configuration
    };
};
