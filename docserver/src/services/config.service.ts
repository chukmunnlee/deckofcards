import {Inject, Injectable} from "@nestjs/common";

import {CLI_OPTIONS} from "src/constants";

@Injectable()
export class ConfigService {

  private argv!: any
  private _inactive!: number

  get cors() { return this.argv.cors }
  get port() { return this.argv.port }
  get decksDir() { return this.argv.decksDir }
  get drop() { return this.argv.drop }
  get prefix() { return this.argv.prefix }
  get database() { return this.argv.database }
  get mongodbUri() { return this.argv.mongodbUri }
  get inactive() { return this._inactive }
  get exportInterval() { return this.argv.exportInterval }
  get hash() { return this.argv.hash }
  get instrumentation() { return this.argv.instrumentation }
  get otelUri() { return this.argv.otelUri }
  get metadata() { return this.argv.metadata }

  set ready(r: number) { this.argv.ready = r }
  get ready(): number { return this.argv.ready }
  get env(): string { return this.argv.env }

  get config() {
    return {
      hash: this.argv.hash,
      cors: !!this.argv.cors,
      port: this.argv.port,
      prefix: this.argv.prefix,
      metricsPort: this.argv.metricsPort,
      metricsPrefix: this.argv.metricsPrefix,
      exportInterval: this.argv.exportInterval,
      ready: this.argv.ready
    }
  }

  constructor(@Inject(CLI_OPTIONS) opts: { [key: string]: any }) {
    this.argv = opts
    this.argv.ready = 0
    this._inactive = this.argv.inactive * 60 * 1000
  }

}
