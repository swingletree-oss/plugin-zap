import { injectable } from "inversify";
import * as Nunjucks from "nunjucks";
import { log } from "@swingletree-oss/harness";

@injectable()
export class TemplateEngine {

  private readonly environment: Nunjucks.Environment;

  constructor() {
    this.environment = Nunjucks.configure("templates");

    this.addFilter("gateStatusIcon", this.qualityGateStatusIconFilter);
    this.addFilter("gateConditionIcon", this.qualityGateConditionIconFilter);
    this.addFilter("delta", this.deltaFilter);
    this.addFilter("fixed", this.fixedFilter);
    this.addFilter("keys", this.listKeys);
  }

  /** Gets and fills a template
   *
   * @param template Template to use
   * @param context context supplied to the template
   */
  public template<T extends TemplateData>(template: Templates, context: T): string {
    log.debug("processing template %s", template);
    return this.environment.render(template, context);
  }

  public addFilter(filterName: string, filter: (...args: any[]) => any) {
    log.debug("adding filter %s to templating environment", filterName);
    this.environment.addFilter(filterName,  filter);
  }

  public deltaFilter(value: number) {
    return `${(value > 0) ? "+" : ""}${value}`;
  }

  public fixedFilter(value: number) {
    return value.toFixed(1);
  }

  public qualityGateStatusIconFilter(str: string) {
    if (str == "OK") return ":large_blue_circle:";
    if (str == "ERROR") return ":red_circle:";
    if (str == "NO_VALUE") return ":white_circle:";

    return "";
  }

  public qualityGateConditionIconFilter(str: string) {
    if (str == "NOT_EQUALS") return "&ne;";
    if (str == "EQUALS") return "=";
    if (str == "GREATER_THAN") return "&gt;";
    if (str == "LESS_THAN") return "&lt;";

    return str;
  }

  public listKeys(object: any) {
    if (object) {
      return Object.keys(object);
    }
  }
}

export enum Templates {
  /** Template for GitHub Check Run summaries */
  CHECK_RUN_SUMMARY = "check-run/summary.md.tpl",
  ZAP_SCAN = "zap/report.md.tpl",
  TWISTLOCK_SCAN = "twistlock/scan.md.tpl"
}

export interface TemplateData {
}
