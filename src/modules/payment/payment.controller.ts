import { Controller, Post, Req, Logger, Res } from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';

const logger = new Logger('PaymentController');

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('webhook')
    @ApiOperation({ summary: 'Webhook de MercadoPago', description: 'Receives events from MercadoPago and processes them' })
    @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    async handleWebhook(@Req() req: Request, @Res() res: Response) {
        logger.log(req);
        const event = req.body;
        return this.paymentService.mercadopagoWebhook(event, res);
    }
}