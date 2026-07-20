import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { IS_PUBLIC_KEY } from "../auth/decorators";

@Injectable()
export class PublicCacheInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const req = context.switchToHttp().getRequest<{ method?: string }>();

    if (!isPublic || req.method !== "GET") {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        const res = context.switchToHttp().getResponse<{
          setHeader?: (k: string, v: string) => void;
          getHeader?: (k: string) => string | undefined;
        }>();
        if (res.setHeader && !res.getHeader?.("Cache-Control")) {
          res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
        }
        return data;
      }),
    );
  }
}
