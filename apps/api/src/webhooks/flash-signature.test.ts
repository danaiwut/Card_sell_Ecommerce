import { describe, expect, it } from "vitest";
import { signFlashParams, verifyFlashParams } from "./flash-signature";

describe("Flash signature helpers", () => {
  it("signs params using Flash SHA256 rules", () => {
    const sign = signFlashParams(
      {
        mchId: "AAXXXX",
        nonceStr: "yyv6YJP436wCkdpNdghC",
        body: "test",
      },
      "dd807a8e18b40153888e5a9864e70080",
    );

    expect(sign).toBe("AA075587187F40061528416620955EAB0974FD79BB5A85F6E249969865ED4EED");
  });

  it("verifies webhook params that only sign mchId and nonceStr", () => {
    const apiKey = "secret";
    const params = {
      mchId: "AAXXXX",
      nonceStr: "1612762153325",
    };

    expect(
      verifyFlashParams(
        {
          ...params,
          sign: signFlashParams(params, apiKey),
        },
        apiKey,
      ),
    ).toBe(true);
  });
});
