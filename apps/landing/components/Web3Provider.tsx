import React, { ReactNode } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import {
    getDefaultConfig,
    RainbowKitProvider,
    darkTheme,
    lightTheme
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import {
    QueryClientProvider,
    QueryClient,
} from "@tanstack/react-query";

// Registered on cloud.reown.com — used as verified fallback if env var is absent
const REGISTERED_PROJECT_ID = '0a61e02d04b75806dbeef0768c303240';

const walletConnectProjectId =
    (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string) || REGISTERED_PROJECT_ID;

const config = getDefaultConfig({
    appName: 'Vunachain',
    projectId: walletConnectProjectId,
    chains: [mainnet, sepolia],
    ssr: false,
});

const queryClient = new QueryClient();

interface Web3ProviderProps {
    children: any;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider
                    theme={lightTheme({ accentColor: '#10b981' })}
                >
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
};
