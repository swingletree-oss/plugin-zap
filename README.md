# Swingletree OWASP Zap Plugin

[OWASP Zap][zap] (aka Zed Attack Proxy) is a security scanner. It offers to generate a JSON-Report when running a scan, which the Swingletree Zap plugin can consume.

## Features

The Swingletree Zap Plugin offers following functionalities:

* Attaches OWASP Zap findings to GitHub Pull Requests by evaluating the Zap scan report.

Processed data is persisted to ElasticSearch (if enabled) and can be processed to reports using Kibana or Grafana.

## Sending a scan report to Swingletree

A Gate webhook is published when the Zap Plugin is enabled.
It accepts a OWASP Zao scan report in JSON format as a payload and needs some additional query parameters to link the report to a GitHub repository:

```yaml
gate:
  plugins:
    - id: zap
      base: # enter base url of plugin-zap instance
```

Gate publishes an endpoint which is connected to the plugin. You will need to attach information about the target repository using the provided methods of Gate (for example HTTP Headers or query parameters):

```
POST /report/zap?org=[GitHub Organization]&repo=[Repository name]&sha=[Commit SHA]&branch=[branch]
```

Swingletree will process the report and send a Check Run Status with the context `security/zap` to the given GitHub coordinates.

[zap]: https://www.owasp.org/index.php/OWASP_Zed_Attack_Proxy_Project