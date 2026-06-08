import { EventEmitter } from 'events';

export type AuctionStreamEvent = {
  type:
    | 'state'
    | 'participant_joined'
    | 'scheduled'
    | 'round_started'
    | 'round_ending'
    | 'price_lowered'
    | 'hold'
    | 'withdraw'
    | 'ended'
    | 'tick';
  payload: Record<string, unknown>;
  at: string;
};

class AuctionEventHub {
  private readonly emitters = new Map<string, EventEmitter>();

  private getEmitter(sessionId: string): EventEmitter {
    let emitter = this.emitters.get(sessionId);
    if (emitter == null) {
      emitter = new EventEmitter();
      emitter.setMaxListeners(100);
      this.emitters.set(sessionId, emitter);
    }
    return emitter;
  }

  subscribe(sessionId: string, listener: (event: AuctionStreamEvent) => void): () => void {
    const emitter = this.getEmitter(sessionId);
    emitter.on('event', listener);
    return () => emitter.off('event', listener);
  }

  publish(sessionId: string, event: Omit<AuctionStreamEvent, 'at'>): void {
    const payload: AuctionStreamEvent = { ...event, at: new Date().toISOString() };
    this.getEmitter(sessionId).emit('event', payload);
  }
}

export const auctionEventHub = new AuctionEventHub();
