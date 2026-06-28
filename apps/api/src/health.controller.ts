import { Controller, Get } from "@nestjs/common";
import { Public } from "./auth/decorators";

@Controller()
export class HealthController {
  @Public()
  @Get()
  root() {
    return { name: "CardVerse API", status: "ok" };
  }

  @Public()
  @Get("health")
  health() {
    return { status: "ok", time: new Date().toISOString() };
  }
}
