import {Controller, Get, HttpException, HttpStatus} from "@nestjs/common";
import {FactoryRepository} from "src/repositories/factory.repository";
import {ConfigService} from "src/services/config.service";

@Controller('/app')
export class AppController {

  constructor(private configSvc: ConfigService, private factoryRepo: FactoryRepository) { }

  @Get('/config')
  getConfig() {
    return this.configSvc.config
  }

  @Get('/ready')
  getReady() {

    if (!this.configSvc.ready)
      throw new HttpException('The service is not ready', HttpStatus.SERVICE_UNAVAILABLE)

    return { ready: 1, timestamp: (new Date()).getTime() }
  }

  @Get('/health')
  getHealth() {
    try {
      return this.factoryRepo.ping()
          .then(result => ({
            db: result.db, ok: result.ok,
            timestamp: (new Date()).getTime()
          }))
    } catch (e) {
      throw new HttpException(JSON.stringify(e), HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
