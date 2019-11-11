"use strict";

import * as chai from "chai";
import { describe } from "mocha";
import * as sinon from "sinon";
import { mockReq, mockRes } from "sinon-express-mock";
import ZapWebhook from "../../src/webhook";
import { ConfigurationServiceMock, ZapStatusEmitterMock } from "../mock-classes";
import { Harness, Comms } from "@swingletree-oss/harness";
import { Zap } from "../../src/model";

chai.use(require("sinon-chai"));

const sandbox = sinon.createSandbox();

describe("Zap Webhook", () => {

  let uut;
  let requestMock, responseMock;
  let zapTestData;

  beforeEach(() => {
    uut = new ZapWebhook(
      new ZapStatusEmitterMock(),
      new ConfigurationServiceMock()
    );

    requestMock = mockReq();
    requestMock.headers = {};
    responseMock = mockRes();

    zapTestData = Object.assign({}, require("../mock/zap-report.json"));
  });



  ["owner", "repo", "sha", "branch"].forEach((prop) => {
    it(`should answer with 400 when missing ${prop} parameter`, async () => {
      requestMock.body = {
        data: {
          report: {
            site: {}
          },
          headers: {}
        },
        meta: {
          source: {
            branch: [ "master" ],
            owner: "org",
            repo: "repo",
            sha: "sha"
          } as Harness.GithubSource
        } as Comms.Gate.PluginReportProcessMetadata
      } as Comms.Gate.PluginReportProcessRequest<Zap.Report>;

      requestMock.body.meta.source[prop] = undefined;

      await uut.webhook(requestMock, responseMock);

      sinon.assert.calledOnce(responseMock.send);
      sinon.assert.calledWith(responseMock.status, 400);
    });
  });

  it(`should answer with 400 when missing site property in report body`, async () => {
    requestMock.body = {
      data: {
        report: {},
        headers: {}
      },
      meta: {
        source: {
          branch: [ "master" ],
          owner: "org",
          repo: "repo",
          sha: "sha"
        } as Harness.GithubSource
      } as Comms.Gate.PluginReportProcessMetadata
    } as Comms.Gate.PluginReportProcessRequest<Zap.Report>;

    await uut.webhook(requestMock, responseMock);

    sinon.assert.calledOnce(responseMock.send);
    sinon.assert.calledWith(responseMock.status, 400);
  });

  it(`should answer with 204 when receiving valid request`, async () => {
    requestMock.body = {
      data: {
        report: {
          site: {}
        },
        headers: {}
      },
      meta: {
        source: {
          branch: [ "master" ],
          owner: "org",
          repo: "repo",
          sha: "sha"
        } as Harness.GithubSource
      } as Comms.Gate.PluginReportProcessMetadata
    } as Comms.Gate.PluginReportProcessRequest<Zap.Report>;

    await uut.webhook(requestMock, responseMock);

    sinon.assert.calledOnce(responseMock.send);
    sinon.assert.calledWith(responseMock.status, 204);
  });
});
