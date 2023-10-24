import Stripe from 'stripe';
import {
    envStripeKeySecret,
    envStripeKeyPublic,
} from '../config.js';

export default class PaymentsService {
    constructor() {
        this.stripe = new Stripe(envStripeKeySecret);
    };
    async newPaymentIntentService(uid, email, order) {
        let response = {};
        try {
            const paymentIntent = await this.stripe.checkout.sessions.create({
                line_items: order.successfulProducts.map(product => ({
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: product.product.title,
                            description: product.product.description,
                        },
                        unit_amount: product.product.price * 100,
                    },
                    quantity: product.quantity,
                })),
                mode: 'payment',
                metadata: {
                    uid: uid,
                    email: email
                },
                success_url: 'https://proyecto-final-bk-cd-railway-production-19ab.up.railway.app/paySuccess',
                cancel_url: 'https://proyecto-final-bk-cd-railway-production-19ab.up.railway.app/cart',
            })
            if (paymentIntent.url) {
                response.statusCode = 200;
                response.message = "Intento de pago generado exitosamente.";
                response.result = paymentIntent.url;
            } else {
                response.statusCode = 500;
                response.message = "Error al obtener la URL de Stripe.";
            }
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al generar intento de pago - Service: " + error.message;
        };
        return response;
    };
};