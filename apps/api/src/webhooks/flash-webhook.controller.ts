import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
} from "@nestjs/common";
import { Public } from "../auth/decorators";
import { QueueService } from "../queue/queue.service";
import { verifyFlashParams } from "./flash-signature";

@Controller("webhooks/courier")
export class FlashWebhookController {
  private readonly logger = new Logger(FlashWebhookController.name);

  constructor(private readonly queue: QueueService) {}

  @Public()
  @Post("flash")
  @HttpCode(200)
  async handleFlash(@Body() body: Record<string, unknown>) {
    const apiKey = process.env.FLASH_API_KEY;
    const mchId = process.env.FLASH_MCH_ID;
    if (!apiKey || !mchId) {
      this.logger.warn("Flash courier is not configured; webhook ignored.");
      return this.success();
    }

    if (body.mchId !== mchId) {
      throw new BadRequestException("Invalid Flash merchant id");
    }

    // Flash webhook docs state only mchId and nonceStr participate in signing.
    const signedParams = {
      mchId: body.mchId,
      nonceStr: body.nonceStr,
      sign: body.sign,
    };
    if (!verifyFlashParams(signedParams, apiKey)) {
      throw new BadRequestException("Invalid Flash signature");
    }

    await this.queue.enqueueShipmentTracking({
      courier: "FLASH",
      source: "webhook",
      payload: body,
    });
    return this.success();
  }

  private success() {
    return { errorCode: "1", state: "success" };
  }
}
