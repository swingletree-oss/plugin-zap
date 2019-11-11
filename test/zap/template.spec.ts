"use strict";

import * as chai from "chai";
import { expect } from "chai";
import { describe } from "mocha";
import * as sinon from "sinon";
import { TemplateEngine, Templates } from "../../src/template/template-engine";
import { ZapPlugin } from "../../src/main";
import { Zap, ZapReportData } from "../../src/model";
import { Harness } from "@swingletree-oss/harness";

chai.use(require("sinon-chai"));

const sandbox = sinon.createSandbox();

describe("Zap Template", () => {

  let envBackup;
  let zapTestData;

  beforeEach(() => {

    envBackup = process.env;
    zapTestData = Object.assign({}, require("../mock/zap-report.json"));
  });

  afterEach(() => {
    process.env = envBackup;
  });

  describe("GitHub Check Summary", () => {
    let uut: TemplateEngine;

    beforeEach(() => {
      uut = new TemplateEngine();
      uut.addFilter("zapRiskcodeIcon", ZapPlugin.zapRiskcodeIconFilter);
      uut.addFilter("zapConfidence", ZapPlugin.zapConfidenceFilter);
    });

    it("should compile the template", () => {
      uut.template(Templates.ZAP_SCAN, undefined);
    });

    it("should run ZAP template with test data", () => {
      const source = new Harness.GithubSource();
      source.owner = "org";
      source.repo = "repo";

      const templateContent = uut.template<Zap.ReportTemplate>(Templates.ZAP_SCAN, {
        event: new ZapReportData(zapTestData, source)
      });

      expect(templateContent).to.contain("2.7.0", "zap version is missing or has not the expected value");
      expect(templateContent).to.contain("Mon, 6 May 2019 13:28:14", "report date is missing or has not the expected value");
      expect(templateContent).to.contain("X-Frame-Options Header Not Set", "report items are missing");
    });

  });

});
