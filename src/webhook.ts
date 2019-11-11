"use strict";

import { Comms, Harness, log } from "@swingletree-oss/harness";
import { BadRequestError } from "@swingletree-oss/harness/dist/comms";
import { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { ConfigurationService, ZapConfig } from "./configuration";
import ZapStatusEmitter from "./status-emitter";
import { Zap, ZapReportData } from "./model";

/** Provides a Webhook for Sonar
 */
@injectable()
class ZapWebhook {
  private configurationService: ConfigurationService;
  private emitter: ZapStatusEmitter;

  constructor(
    @inject(ZapStatusEmitter) emitter: ZapStatusEmitter,
    @inject(ConfigurationService) configurationService: ConfigurationService,
  ) {
    this.configurationService = configurationService;
    this.emitter = emitter;
  }

  private isWebhookEventRelevant(event: Zap.Report) {
    return event && event.site !== undefined;
  }

  public getRouter(): Router {
    const router = Router();
    router.post("/", this.webhook.bind(this));
    return router;
  }

  public webhook = async (req: Request, res: Response) => {
    log.debug("received Zap webhook event");

    if (this.configurationService.getBoolean(ZapConfig.LOG_WEBHOOK_EVENTS)) {
      log.debug("webhook data: %j", req.body);
    }

    const message: Comms.Gate.PluginReportProcessRequest<Zap.Report> = req.body;
    const reportData: Zap.Report = message.data.report;

    if (!message.meta || !message.meta.source) {
      res.status(400).send(
        new Comms.Message.ErrorMessage(
          new BadRequestError("malformed source object in request metadata.")
        )
      );
      return;
    }

    const source = new Harness.GithubSource();
    Object.assign(source, message.meta.source);

    if (!source.isDataComplete()) {
      res.status(400).send(
        new Comms.Message.ErrorMessage(
          new BadRequestError("missing source coordinates in request metadata.")
        )
      );
      return;
    }

    if (this.isWebhookEventRelevant(reportData)) {
      const reportReceivedEvent = new ZapReportData(reportData, source);

      this.emitter.sendReport(reportReceivedEvent);
    } else {
      log.debug("zap webhook data did not contain a report. This event will be ignored.");
      res.status(400).send({
          errors: [new Comms.BadRequestError("zap webhook data did not contain a report")]
        } as Comms.Message.ErrorMessage);
      return;
    }

    res.status(204).send();
  }
}

export default ZapWebhook;