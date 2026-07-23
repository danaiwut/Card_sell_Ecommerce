export class HealthController {
  root() {
    return { name: "CardVerse API", status: "ok" };
  }

  health() {
    return { status: "ok", time: new Date().toISOString() };
  }
}
