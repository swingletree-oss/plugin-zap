import container from "./ioc-config";
import { Zap } from "./model";
import { TemplateEngine } from "./template/template-engine";
import { log } from "@swingletree-oss/harness";
import { WebServer } from "./webserver";
import ZapStatusEmitter from "./status-emitter";
import ZapWebhook from "./webhook";

require("source-map-support").install();

process.on("unhandledRejection", error => {
  // Will print "unhandledRejection err is not defined"
  console.log("unhandledRejection ", error);
});

export class ZapPlugin {

  constructor() {
  }

  public run(): void {
    log.info("Starting up Twistlock Plugin...");
    const webserver = container.get<WebServer>(WebServer);

    // initialize Emitters
    container.get<ZapStatusEmitter>(ZapStatusEmitter);

    // add webhook endpoint
    webserver.addRouter("/report", container.get<ZapWebhook>(ZapWebhook).getRouter());

    // add template filter for risk code icons
    container.get<TemplateEngine>(TemplateEngine).addFilter("zapRiskcodeIcon", ZapPlugin.zapRiskcodeIconFilter);
    container.get<TemplateEngine>(TemplateEngine).addFilter("zapConfidence", ZapPlugin.zapConfidenceFilter);
  }

  public static zapRiskcodeIconFilter(type: Zap.Riskcode | string) {
    if (type == Zap.Riskcode.HIGH) return "<span title=\"High\">&#x1F480;&#xFE0F;</span>";
    if (type == Zap.Riskcode.MEDIUM) return "<span title=\"Medium\">&#x26A0;&#xFE0F;</span>";
    if (type == Zap.Riskcode.LOW) return "<span title=\"Low\">&#x1F53B;&#xFE0F;</span>";
    if (type == Zap.Riskcode.INFORMATIONAL) return "<span title=\"Informational\">&#x2139;&#xFE0F;</span>";

    return type;
  }

  public static zapConfidenceFilter(type: Zap.Confidence | string) {
    if (type == Zap.Confidence.FALSE_POSITIVE) return "false positive";
    if (type == Zap.Confidence.HIGH) return "high";
    if (type == Zap.Confidence.MEDIUM) return "medium";
    if (type == Zap.Confidence.LOW) return "low";
    if (type == Zap.Confidence.USER_CONFIRMED) return "user confirmed";

    return type;
  }
}

new ZapPlugin().run();
