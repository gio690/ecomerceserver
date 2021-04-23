"use strict";

const stripe = require("stripe")(
  "sk_test_51IeoV8BeFwrNjMAxLMRCQnsoIFjSjJ0RRxjOKhPXmhEIuuISUACf1R0kUbIImUlmI7fUBgXFrM2k9NgRAQehViaF00dQ0OKRHr"
);
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async create(ctx) {
    const { tokenStripe, products, idUser, addressShipping } = ctx.request.body;
    // const { price, discount, quantify } = products;
    let totalPayment = 0;
    let total = 0;
    let discount = 0;
    products.forEach((product) => {
      if (!product.discount)
        return (totalPayment += product.price * product.quantify);

      discount += ((product.price * product.discount) / 100) * product.quantify;
      total += product.price * product.quantify;
      totalPayment = total - discount;
    });
    // console.log(totalPayment);
    const charge = await stripe.charges.create({
      amount: totalPayment * 100,
      currency: "eur",
      source: tokenStripe,
      description: `ID Usuario: ${idUser}`,
    });
    const createOrder = [];

    for await (const product of products) {
      const data = {
        product: product.id,
        user: idUser,
        totalPayment: totalPayment,
        productsPayment: product.price * product.quantity,
        quantity: product.quantity,
        idPayment: charge.id,
        addressShipping,
      };

      const validData = await strapi.entityValidator.validateEntityCration(
        strapi.models.order,
        data
      );
      const entry = await strapi.query("order").create(validData);
      createOrder.push(entry);
    }

    return createOrder;
  },
};
