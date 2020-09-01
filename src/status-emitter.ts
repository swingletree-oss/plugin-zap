import { inject, injectable } from "inversify";
import { TemplateEngine, Templates } from "./template/template-engine";
import { ConfigurationService, ZapConfig } from "./configuration";
import { Harness, log } from "@swingletree-oss/harness";
import { Zap, ZapReportData } from "./model";
import ScottyClient from "@swingletree-oss/scotty-client";

@injectable()
class ZapStatusEmitter {
  private readonly templateEngine: TemplateEngine;
  private readonly context: string;
  private readonly scottyClient: ScottyClient;

  constructor(
    @inject(ConfigurationService) configurationService: ConfigurationService,
    @inject(TemplateEngine) templateEngine: TemplateEngine
  ) {
    this.templateEngine = templateEngine;
    this.scottyClient = new ScottyClient(configurationService.get(ZapConfig.SCOTTY_URL));
    this.context = configurationService.get(ZapConfig.CONTEXT);
  }

  public getAnnotations(report: Zap.Report): Harness.Annotation[] {
    const annotations: Harness.Annotation[] = [];

    report.site.forEach((site) => {
      site.alerts.forEach((alert) => {
        const annotation = new Harness.ProjectAnnotation();
        annotation.title = alert.alert;
        annotation.severity = Zap.SeverityUtil.convert(alert.riskcode);
        annotation.metadata = {
          riskdesc: alert.riskdesc,
          riskcode: alert.riskcode,
          confidence: alert.confidence
        };

        annotations.push(annotation);
      });
    });

    return annotations;
  }

  public async sendReport(event: ZapReportData, uid: string) {
    const annotations = this.getAnnotations(event.report);

    const templateData: Zap.ReportTemplate = {
      event: event
    };

    const notificationData: Harness.AnalysisReport = {
      sender: this.context,
      source: event.source,
      uuid: uid,
      checkStatus: annotations.length == 0 ? Harness.Conclusion.PASSED : Harness.Conclusion.BLOCKED,
      title: `${annotations.length} issues found`,
      metadata: {
        zapVersion: event.report["@version"]
      },
      annotations: annotations
    };

    notificationData.markdown = this.templateEngine.template<Zap.ReportTemplate>(
      Templates.ZAP_SCAN,
      templateData
    );

    try {
      return await this.scottyClient.sendReport(notificationData);
    } catch (error) {
      log.error("could not send payload to scotty.\n%j", error);
    }
  }
}

export default ZapStatusEmitter;