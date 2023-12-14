import { useAtom } from 'jotai';
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';
import { useChainId } from 'wagmi';

import { config } from 'config';
import { mainWsLatestMessageTimeAtom, webSocketReadyAtom } from 'store/pools.store';

import { createWebSocketWithReconnect } from '../createWebSocketWithReconnect';
import { useHandleMessage } from '../hooks/useHandleMessage';
import { useMessagesToSend } from '../hooks/useMessagesToSend';
import { usePingPong } from '../hooks/usePingPong';
import { useSend } from '../hooks/useSend';
import { WebSocketI } from '../types';
import { useWsMessageHandler } from './useWsMessageHandler';
import { WebSocketContext, WebSocketContextI } from './WebSocketContext';

export const WebSocketContextProvider = ({ children }: PropsWithChildren) => {
  const [isWebSocketReady, setWebSocketReady] = useAtom(webSocketReadyAtom);
  const [latestMessageTime] = useAtom(mainWsLatestMessageTimeAtom);
  const chainId = useChainId();

  const wsRef = useRef<WebSocketI>();
  const waitForPongRef = useRef(false);

  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const handleWsMessage = useWsMessageHandler();

  usePingPong({
    client: wsRef.current,
    isConnected,
    latestMessageTime,
    waitForPongRef,
  });

  useHandleMessage({
    messages,
    setMessages,
    handleWsMessage,
  });

  const { setMessagesToSend } = useMessagesToSend({
    client: wsRef.current,
    isConnected,
  });

  const send = useSend({
    client: wsRef.current,
    isConnected,
    setMessagesToSend,
    waitForPongRef,
  });

  useEffect(() => {
    wsRef.current?.close();

    const wsUrl = config.wsUrl[`${chainId}`] || config.wsUrl.default;
    wsRef.current = createWebSocketWithReconnect(wsUrl);
    wsRef.current.onStateChange(setIsConnected);

    const handleMessage = (message: string) => {
      setMessages((prevState) => [...prevState, message]);
    };
    wsRef.current.on(handleMessage);
    return () => {
      wsRef.current?.off(handleMessage);
      wsRef.current?.close();
    };
  }, [chainId]);

  useEffect(() => {
    if (!isConnected) {
      setWebSocketReady(false);
    }
  }, [setWebSocketReady, isConnected]);

  const contextValue: WebSocketContextI = useMemo(
    () => ({
      isConnected: isWebSocketReady,
      send,
    }),
    [isWebSocketReady, send]
  );

  return <WebSocketContext.Provider value={contextValue}>{children}</WebSocketContext.Provider>;
};
