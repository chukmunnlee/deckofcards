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
import {WinstonInstrumentation} from "@opentelemetry/instrumentation-winston";

export const telemetry: { [key: string]: any } = {}

// IMPORTANT: This library MUST be executed with --required before the main program
// Otherwise auto instrumentation will not work

export const loadTelemetry = () => {

  const argv = parseCLI()
  const OTEL_ENDPOINT = argv.otelUri

  let sdk: NodeSDK | null = null

  if (argv.instrumentation) {

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

    sdk = new NodeSDK({
      resource,
      metricReader,
      spanProcessor,
      instrumentations: [
        new HttpInstrumentation({
          applyCustomAttributesOnSpan: (span) => { span.setAttribute('hash', argv.hash) }
        }),
        new MongoDBInstrumentation({ enhancedDatabaseReporting: true, enabled: true }),
        new ExpressInstrumentation({ enabled: true,
          requestHook: (span, _) => { span.setAttribute('hash', argv.hash) }
        }),
        new NestInstrumentation({ enabled: false }),
        new WinstonInstrumentation({
          disableLogSending: false,
          disableLogCorrelation: false,
          logHook: (span, record) => { record['hash'] = argv.hash }
        })
      ]
    })

    sdk.start()
  }

  const meter = metrics.getMeter(argv[ATTR_SERVICE_NAME], argv[ATTR_SERVICE_VERSION])
  const tracer = trace.getTracer(argv[ATTR_SERVICE_NAME], argv[ATTR_SERVICE_VERSION])

  telemetry['meter'] = meter
  telemetry['tracer'] = tracer
  telemetry['sdk'] = sdk

}

loadTelemetry()
