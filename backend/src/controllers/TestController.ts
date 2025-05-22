import { Get, JsonController } from "routing-controllers";

@JsonController("/test")
export class TestController {
    @Get("/")
    hello() {
        return { message: "🎉 Backend is up and running!" };
    }
}
