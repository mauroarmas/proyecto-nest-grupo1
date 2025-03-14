import { Controller, Post, Req, Logger, Res } from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { Response } from 'express';

const logger = new Logger('PaymentController');

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('webhook')
    async handleWebhook(@Req() req: Request, @Res() res: Response) {
        logger.log(req);
        const event = req.body;
        return this.paymentService.mercadopagoWebhook(event, res);
    }
}