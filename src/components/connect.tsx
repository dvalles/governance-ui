import { BaseWallet } from '@polkadot-onboard/core';
import React, { useEffect, useState } from 'react';
import { useAccount } from '../contexts/Account';
import type { SigningAccount } from '../contexts/Account';
import { WalletState, useWallets } from '../contexts/Wallets';
import { Button, Modal } from './common';
import Account from './account';
import Wallet from './wallet';

export interface IWalletsListProps {
  wallets: Array<BaseWallet>;
  walletState: Map<string, WalletState>;
  walletConnectHandler: (wallet: BaseWallet) => void;
}

const WalletsList = ({
  wallets,
  walletState,
  walletConnectHandler,
}: IWalletsListProps) => {
  return (
    <div>
      {wallets?.map((wallet) => {
        const name = wallet?.metadata.title;
        const iconUrl = wallet?.metadata.iconUrl;
        const state = walletState.get(wallet?.metadata.title) || 'disconnected';
        return (
          <Wallet
            name={name}
            state={state}
            clickHandler={() => walletConnectHandler(wallet)}
          />
        );
      })}
    </div>
  );
};

export interface IAccountListProps {
  accounts: Map<string, SigningAccount>;
  connectedAccount: SigningAccount | undefined;
  accountConnectHandler: (account: SigningAccount) => void;
}

const AccountList = ({
  accounts,
  connectedAccount,
  accountConnectHandler,
}: IAccountListProps) => {
  return (
    <div>
      {[...accounts.values()].map((signingAccount) => {
        const { account } = signingAccount;
        const isConnected =
          connectedAccount &&
          connectedAccount.account.address === account.address;
        return (
          <Account
            name={account.name}
            address={account.address}
            state={{ isConnected }}
            clickHandler={() => accountConnectHandler(signingAccount)}
          />
        );
      })}
    </div>
  );
};

type ConnectViews = 'wallets' | 'accounts';

const ConnectButton = (props) => {
  const [visible, setVisible] = useState(false);
  const [currentView, setCurrentView] = useState<ConnectViews>();
  const { wallets, walletState, setWalletState } = useWallets();
  const { connectedAccount, setConnectedAccount, walletsAccounts } =
    useAccount();

  const loadedAccountsCount = walletsAccounts ? walletsAccounts.size : 0;

  const initialView: ConnectViews =
    loadedAccountsCount > 0 ? 'accounts' : 'wallets';

  const toggleView = () => {
    setCurrentView((oldView) =>
      oldView === 'wallets' ? 'accounts' : 'wallets'
    );
  };
  const walletConnectHandler = async (wallet: BaseWallet) => {
    if (walletState.get(wallet?.metadata.title) == 'connected') {
      await wallet.disconnect();
      setWalletState(wallet?.metadata.title, 'disconnected');
    } else {
      await wallet.connect();
      setWalletState(wallet?.metadata.title, 'connected');
    }
  };
  const accountConnectHandler = async (signingAccount: SigningAccount) => {
    setConnectedAccount(signingAccount);
    closeModal();
  };
  const closeModal = () => {
    setVisible(false);
  };
  const openModal = () => {
    setCurrentView(initialView);
    setVisible(true);
  };
  useEffect(() => {
    setCurrentView(initialView);
  }, [initialView]);
  const onPress = () => openModal();
  return (
    <>
      <Button {...{ ...props, onPress }}>
        {connectedAccount
          ? `Connected - ${connectedAccount.account.name}`
          : 'Connect'}
      </Button>
      <Modal visible={visible} width={600} onClose={() => closeModal()}>
        <div onClick={() => toggleView()}>{`${
          currentView === 'accounts'
            ? '< wallets'
            : loadedAccountsCount
            ? 'accounts >'
            : ''
        }`}</div>
        {currentView === 'accounts' && (
          <AccountList
            accounts={walletsAccounts}
            connectedAccount={connectedAccount}
            accountConnectHandler={accountConnectHandler}
          />
        )}
        {currentView === 'wallets' && (
          <WalletsList
            wallets={wallets}
            walletState={walletState}
            walletConnectHandler={walletConnectHandler}
          />
        )}
      </Modal>
    </>
  );
};

export default ConnectButton;
