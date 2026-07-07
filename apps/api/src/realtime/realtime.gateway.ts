import {
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Injectable } from "@nestjs/common";
import { Server } from "socket.io";
import {
  SOCKET_EVENTS,
  type TradeDto,
  type MarketStatsDto,
  type ShipmentUpdateEventDto,
} from "@cardverse/shared";

@Injectable()
@WebSocketGateway({
  cors: { origin: (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(",") },
})
export class RealtimeGateway {
  @WebSocketServer()
  server!: Server;

  /** Broadcast a freshly completed sale to the global marketplace feed. */
  emitRecentSale(trade: TradeDto) {
    this.server?.emit(SOCKET_EVENTS.RECENT_SALE, trade);
  }

  /** Broadcast updated market stats for a catalog item. */
  emitPriceUpdate(stats: MarketStatsDto) {
    this.server?.emit(SOCKET_EVENTS.PRICE_UPDATE, stats);
    this.server?.to(`catalog:${stats.catalogItemId}`).emit(
      SOCKET_EVENTS.PRICE_UPDATE,
      stats,
    );
  }

  /** Broadcast shipment changes so buyer/seller pages can refresh without polling. */
  emitShipmentUpdate(update: ShipmentUpdateEventDto) {
    this.server?.emit(SOCKET_EVENTS.SHIPMENT_UPDATE, update);
  }
}
