import {metrics, trace} from "@opentelemetry/api";
import {PeriodicExportingMetricReader} from "@opentelemetry/sdk-metrics";
import {BatchSpanProcessor} from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc'
//import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
//import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import {NodeSDK} from "@opentelemetry/sdk-node";
import {resourceFromAttributes} from "@opentelemetry/resources";

import {parseCLI} from "./utils/cliopt";
import {ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION} from "@opentelemetry/semantic-conventions";
import {MongoDBInstrumentation} from "@opentelemetry/instrumentation-mongodb";
import {ExpressInstrumentation} from "@opentelemetry/instrumentation-express";
import {HttpInstrumentation} from "@opentelemetry/instrumentation-http";
import {NestInstrumentation} from "@opentelemetry/instrumentation-nestjs-core";

export const telemetry: { [key: string]: any } = {}

export const loadTelemetry = () => {

  const argv = parseCLI()
  const OTEL_ENDPOINT = 'http://localhost:4317'

  const resource = resourceFromAttributes(argv.metadata)

  const metricExporter = new OTLPMetricExporter({ 
    //url: `${OTEL_ENDPOINT}/v1/metrics`, // HTTP
    url: `${OTEL_ENDPOINT}`, // gRPC
    concurrencyLimit: 5
  })

  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: argv.exportInterval * 1000,
  })

  const traceExporter = new OTLPTraceExporter({
    url: `${OTEL_ENDPOINT}`,
    //url: `${OTEL_ENDPOINT}/v1/traces`,
    concurrencyLimit: 5
  })

  const spanProcessor = new BatchSpanProcessor(traceExporter)

  const sdk = new NodeSDK({
    resource,
    metricReader,
    spanProcessor,
    instrumentations: [
      new HttpInstrumentation({
        applyCustomAttributesOnSpan: (span) => {
          span.setAttribute('hash', argv.hash)
        }
      }),
      new MongoDBInstrumentation({ enhancedDatabaseReporting: true, enabled: true,
        dbStatementSerializer: (cmd) => {
          console.info('>>> cmd: ', cmd)
          return 'abc'
        }
      }),
      new ExpressInstrumentation({ enabled: true,
        requestHook: (span, info) => {
          console.info('express: span: ', span)
          console.info('express: info: ', info)
        }
      }),
      new NestInstrumentation({ enabled: true })
    ]
  })

  sdk.start()

  const meter = metrics.getMeter(argv[ATTR_SERVICE_NAME], argv[ATTR_SERVICE_VERSION])
  const tracer = trace.getTracer(argv[ATTR_SERVICE_NAME], argv[ATTR_SERVICE_VERSION])


  telemetry['metricExporter'] = metricExporter
  telemetry['meter'] = meter
  telemetry['tracer'] = tracer
  telemetry['metricReader'] = metricReader
  telemetry['sdk'] = sdk

  return sdk
}

