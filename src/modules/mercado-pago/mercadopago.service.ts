import { log } from 'console';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { PreferenceRequest } from 'mercadopago/dist/clients/preference/commonTypes';
import { mercadopagoConfig } from 'src/common/constants';

export class MercadopagoService {
    private client: MercadoPagoConfig;

    constructor() {
        this.client = new MercadoPagoConfig({
            accessToken: mercadopagoConfig.accessToken,
        });
    }

    async createPayment(cartId: string, amount: number) {
        const preferenceData: PreferenceRequest = {
            items: [
                {
                    id: cartId,
                    title: `Cart ${cartId}`,
                    unit_price: amount,
                    quantity: 1,
                    currency_id: 'ARS',
                },
            ],
            notification_url: mercadopagoConfig.webhookUrl,
            metadata: {
                cartId,
            },
            back_urls: {
                failure: 'http://localhost:3000/profile',
                pending: 'http://localhost:3000/profile',
                success: 'http://localhost:3000/home',
              },
              auto_return: "approved",
        };

        try {
            const preference = new Preference(this.client);
            const result = await preference.create({ body: preferenceData });
            log(result);
            return result;
        } catch (error) {
            console.error('Error al crear el pago:', error);
            throw new Error('Falló la creación del pago');
        }
    }

    async getPayment(id: string) {
        try {
            const paymentClient = new Payment(this.client);
            const result = await paymentClient.get({ id });
            return result;
        } catch (error) {
            console.error('Error al obtener el pago:', error);
            throw new Error('Falló la obtención del pago');
        }
    }
}