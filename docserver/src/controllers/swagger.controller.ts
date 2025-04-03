import {Controller, Get, Render} from "@nestjs/common";

@Controller()
export class SwaggerController {

  @Get('/swagger')
  @Render('swagger.hbs')
  getSwagger() {
    return { message: 'hello world' }
  }
}
