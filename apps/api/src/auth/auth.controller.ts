import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@cardverse/shared";
import { parseZod } from "../common/parse-zod";
import { Public } from "./decorators";
import { LocalAuthService } from "./local-auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: LocalAuthService) {}

  @Public()
  @Post("register")
  register(@Body() body: unknown) {
    return this.auth.register(parseZod(registerSchema, body));
  }

  @Public()
  @Post("login")
  @HttpCode(200)
  login(@Body() body: unknown) {
    return this.auth.login(parseZod(loginSchema, body));
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(200)
  forgotPassword(@Body() body: unknown) {
    return this.auth.requestPasswordReset(parseZod(forgotPasswordSchema, body));
  }

  @Public()
  @Post("reset-password")
  resetPassword(@Body() body: unknown) {
    return this.auth.resetPassword(parseZod(resetPasswordSchema, body));
  }
}
