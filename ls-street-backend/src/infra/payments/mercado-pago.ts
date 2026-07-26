import {
  MercadoPagoConfig,
  Order,
} from "mercadopago";

import { env } from "../../config/env";

const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: env.MERCADO_PAGO_ACCESS_TOKEN,
  options: {
    timeout: 10_000,
  },
});

export const mercadoPagoOrder = new Order(
  mercadoPagoClient,
);