import { describe, expect, it } from "vitest";
import { updateShipmentSchema } from "@cardverse/shared";
import { normalizeShipmentUpdate, orderStatusForShipment } from "./shipping.types";

describe("shipment update helpers", () => {
  it("defaults first shipment updates to SHIPPED when no status is provided", () => {
    expect(
      normalizeShipmentUpdate({
        carrier: "FLASH",
        trackingNumber: "TH123",
      }),
    ).toEqual({
      carrier: "FLASH",
      trackingNumber: "TH123",
      status: "SHIPPED",
      note: undefined,
    });
  });

  it("maps delivered shipment status to delivered order status", () => {
    expect(orderStatusForShipment("DELIVERED")).toBe("DELIVERED");
    expect(orderStatusForShipment("OUT_FOR_DELIVERY")).toBe("SHIPPED");
    expect(orderStatusForShipment("IN_TRANSIT")).toBe("SHIPPED");
    expect(orderStatusForShipment("CANCELLED")).toBe("CANCELLED");
    expect(orderStatusForShipment("PENDING")).toBeNull();
  });

  it("accepts manual shipment status and note", () => {
    expect(
      updateShipmentSchema.parse({
        carrier: "KERRY",
        trackingNumber: "KERRY-123",
        status: "OUT_FOR_DELIVERY",
        note: "ถึงศูนย์ปลายทางแล้ว",
      }),
    ).toMatchObject({
      carrier: "KERRY",
      trackingNumber: "KERRY-123",
      status: "OUT_FOR_DELIVERY",
      note: "ถึงศูนย์ปลายทางแล้ว",
    });
  });
});
