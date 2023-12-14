import { useAtom } from 'jotai';
import { memo, useEffect, useRef, useState } from 'react';
import { useChainId } from 'wagmi';

import { config } from 'config';

import { createWebSocketWithReconnect } from 'context/websocket-context/createWebSocketWithReconnect';
import { useHandleMessage } from 'context/websocket-context/hooks/useHandleMessage';
import { useMessagesToSend } from 'context/websocket-context/hooks/useMessagesToSend';
import { usePingPong } from 'context/websocket-context/hooks/usePingPong';
import { useSend } from 'context/websocket-context/hooks/useSend';
import { WebSocketI } from 'context/websocket-context/types';
import { candlesLatestMessageTimeAtom } from 'store/tv-chart.store';

import { useCandleMarketsSubscribe } from './useCandleMarketsSubscribe';
import { useCandlesWsMessageHandler } from './useCandlesWsMessageHandler';

export const CandlesWebSocketListener = memo(() => {
  const chainId = useChainId();

  const [latestMessageTime] = useAtom(candlesLatestMessageTimeAtom);

  const [messages, setMessages] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocketI>();
  const waitForPongRef = useRef(false);

  const handleWsMessage = useCandlesWsMessageHandler();

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

    const candlesWsUrl = config.candlesWsUrl[`${chainId}`] || config.candlesWsUrl.default;
    wsRef.current = createWebSocketWithReconnect(candlesWsUrl);
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

  useCandleMarketsSubscribe({ isConnected, send });

  return null;
});
