import {Controller, Get} from "@nestjs/common";
import {ConfigService} from "src/services/config.service";

@Controller('/app')
export class AppController {

  constructor(private confiSvc: ConfigService) { }

  @Get('/config')
  getConfig() {
    return this.confiSvc.config
  }
}
