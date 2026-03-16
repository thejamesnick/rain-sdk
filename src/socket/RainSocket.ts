import { io, Socket } from 'socket.io-client';
import { RainCoreConfig, RainEnvironment } from '../types.js';
import { ALLOWED_ENVIRONMENTS, ENV_CONFIG } from '../config/environments.js';
import { EnterOptionEventData, OrderEventData, OrderFilledEventData, DisputeOpenedEventData, AppealOpenedEventData, DisputeTimeExtendedEventData, DisputeWinnerEventData, AppealWinnerEventData, ClaimRewardEventData } from './types.js';

export class RainSocket {
    private socket: Socket;

    constructor(config: RainCoreConfig = {}) {
        const { environment = 'development' } = config;

        function isValidEnvironment(env: string): env is RainEnvironment {
            return ALLOWED_ENVIRONMENTS.includes(env as RainEnvironment);
        }

        if (!isValidEnvironment(environment)) {
            throw new Error(
                `Invalid environment "${environment}". Allowed values: ${ALLOWED_ENVIRONMENTS.join(', ')}`
            );
        }

        const { apiUrl } = ENV_CONFIG[environment];
        this.socket = io(apiUrl, { transports: ['websocket', 'polling'] });
    }

    get connected(): boolean {
        return this.socket.connected;
    }

    onConnect(callback: () => void): void {
        this.socket.on('connect', callback);
    }

    onDisconnect(callback: () => void): void {
        this.socket.on('disconnect', callback);
    }

    /**
     * Subscribe to the enter-option event for a specific market.
     * Fires when a user buys into a market option.
     * Returns an unsubscribe function — call it to stop listening.
     */
    onEnterOption(marketId: string, callback: (data: EnterOptionEventData) => void): () => void {
        const event = `enter-option/${marketId}`;

        const handler = (raw: any) => {
            const investments = (raw?.enterOption?.investment ?? []).map((inv: any) => ({
                choiceIndex: inv?.choiceIndex ?? inv?.option ?? 0,
                amount: String(inv?.amount ?? inv?.investment ?? '0'),
                optionName: inv?.optionName,
            }));

            callback({
                poolId: raw?.pool?._id ?? marketId,
                investments,
                totalInvestmentWei: String(raw?.enterOption?.totalInvestment ?? '0'),
                tokenDecimals: raw?.pool?.token?.tokenDecimals ?? 6,
            });
        };

        this.socket.on(event, handler);
        return () => this.socket.off(event, handler);
    }

    /**
     * Subscribe to the order-created event for a specific market.
     * Fires when a new limit order is placed.
     */
    onOrderCreated(marketId: string, callback: (data: OrderEventData) => void): () => void {
        const event = `order-created/${marketId}`;
        const handler = (raw: any) => {
            callback({
                poolId: raw?.pool?._id ?? marketId,
                order: raw?.order ?? {},
                tokenDecimals: raw?.pool?.token?.tokenDecimals ?? 6,
            });
        };
        this.socket.on(event, handler);
        return () => this.socket.off(event, handler);
    }

    /**
     * Subscribe to the order-cancelled event for a specific market.
     * Fires when an open order is cancelled.
     */
    onOrderCancelled(marketId: string, callback: (data: OrderEventData) => void): () => void {
        const event = `order-cancelled/${marketId}`;
        const handler = (raw: any) => {
            callback({
                poolId: raw?.pool?._id ?? marketId,
                order: raw?.order ?? {},
                tokenDecimals: raw?.pool?.token?.tokenDecimals ?? 6,
            });
        };
        this.socket.on(event, handler);
        return () => this.socket.off(event, handler);
    }

    /**
     * Subscribe to the order-filled event for a specific market.
     * Fires when an order is partially or fully filled.
     */
    onOrderFilled(marketId: string, callback: (data: OrderFilledEventData) => void): () => void {
        const event = `order-filled/${marketId}`;
        const handler = (raw: any) => {
            callback({ poolId: raw?.pool?._id ?? marketId, raw });
        };
        this.socket.on(event, handler);
        return () => this.socket.off(event, handler);
    }

    /**
     * Subscribe to the dispute-opened event for a specific market.
     */
    onDisputeOpened(marketId: string, callback: (data: DisputeOpenedEventData) => void): () => void {
        const event = `dispute-opened/${marketId}`;
        const handler = (raw: any) => {
            callback({
                poolId: raw?.pool?._id ?? marketId,
                isDisputed: raw?.pool?.isDisputed ?? false,
                isAiResolver: raw?.pool?.isAiResolver ?? false,
                status: raw?.pool?.status ?? '',
                disputeData: raw?.pool?.disputeData ?? null,
                winnerDecidedBy: raw?.pool?.winnerOption?.decidedBy ?? '',
            });
        };
        this.socket.on(event, handler);
        return () => this.socket.off(event, handler);
    }

    /**
     * Subscribe to the appeal-opened event for a specific market.
     */
    onAppealOpened(marketId: string, callback: (data: AppealOpenedEventData) => void): () => void {
        const event = `appeal-opened/${marketId}`;
        const handler = (raw: any) => {
            callback({
                poolId: raw?.pool?._id ?? marketId,
                eventType: raw?.eventType ?? '',
                isAppealed: raw?.pool?.isAppealed ?? false,
            });
        };
        this.socket.on(event, handler);
        return () => this.socket.off(event, handler);
    }

    /**
     * Subscribe to the dispute-time-extented event for a specific market.
     * Note: event name matches the backend spelling ("extented").
     */
    onDisputeTimeExtended(marketId: string, callback: (data: DisputeTimeExtendedEventData) => void): () => void {
        const event = `dispute-time-extented/${marketId}`;
        const handler = (raw: any) => {
            callback({
                poolId: raw?.pool?._id ?? marketId,
                eventType: raw?.eventType ?? '',
                newEndTime: raw?.newEndTime ?? '',
            });
        };
        this.socket.on(event, handler);
        return () => this.socket.off(event, handler);
    }

    /**
     * Subscribe to the dispute-winner event for a specific market.
     * Fires when a dispute winner is decided.
     */
    onDisputeWinner(marketId: string, callback: (data: DisputeWinnerEventData) => void): () => void {
        const event = `dispute-winner/${marketId}`;
        const handler = (raw: any) => {
            callback({
                poolId: raw?.pool?._id ?? marketId,
                status: raw?.pool?.status ?? '',
                winnerOption: {
                    decidedBy: raw?.pool?.winnerOption?.decidedBy ?? '',
                    choiceIndex: raw?.pool?.winnerOption?.choiceIndex ?? 0,
                    createdAt: raw?.pool?.winnerOption?.createdAt ?? '',
                },
            });
        };
        this.socket.on(event, handler);
        return () => this.socket.off(event, handler);
    }

    /**
     * Subscribe to the appeal-winner event for a specific market.
     * Fires when an appeal winner is finalized.
     */
    onAppealWinner(marketId: string, callback: (data: AppealWinnerEventData) => void): () => void {
        const event = `appeal-winner/${marketId}`;
        const handler = (raw: any) => {
            callback({
                poolId: raw?.pool?._id ?? marketId,
                eventType: raw?.eventType ?? '',
                winnerFinalized: raw?.winnerFinalized ?? null,
                winnerOption: raw?.pool?.winnerOption ?? null,
            });
        };
        this.socket.on(event, handler);
        return () => this.socket.off(event, handler);
    }

    /**
     * Subscribe to the claim-reward event for a specific market and user.
     * Fires when a user's reward claim is confirmed.
     */
    onClaimReward(marketId: string, userId: string, callback: (data: ClaimRewardEventData) => void): () => void {
        const event = `claim-reward/${marketId}/${userId}`;
        const handler = (_raw: any) => {
            callback({ poolId: marketId, userId });
        };
        this.socket.on(event, handler);
        return () => this.socket.off(event, handler);
    }

    disconnect(): void {
        this.socket.disconnect();
    }
}
