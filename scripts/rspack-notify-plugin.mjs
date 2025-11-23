import { exec } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const notifyScript = path.join(__dirname, "notify-dev-server.sh");

export class NotifyDevServerPlugin {
  constructor() {
    this.name = "NotifyDevServerPlugin";
  }

  apply(compiler) {
    compiler.hooks.done.tap(this.name, (stats) => {
      if (stats.hasErrors()) {
        console.log("⚠️  Build had errors, skipping dev server notification");
        return;
      }

      exec(`sh "${notifyScript}"`, (error) => {
        if (error) {
          // Silently fail if server is not running
          return;
        }
        console.log("✅ Notified dev server of frontend changes");
      });
    });
  }
}
