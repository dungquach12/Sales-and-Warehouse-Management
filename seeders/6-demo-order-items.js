"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert("OrderItems", [
      {
        id: 'b6820886-694f-4fa7-9526-6a488d7ce772',
        order_id: 'e7130ab4-8249-4155-9b80-39be470676a9',
        product_id: '40405bf3-18f6-453a-afb4-a2dfbc6b892a',
        quantity: 2,
        unit_price: 15000,
      },
      {
        id: '23c8dc16-2aed-45e1-b7cb-70392c0136f3',
        order_id: '225203bf-ab59-4650-9b82-bc3d18e44d47',
        product_id: '4010eeef-4bb7-4947-a11b-1841286e847e',
        quantity: 1,
        unit_price: 18000,
      },
      {
        id: 'e51ac8c5-d3b7-499d-a580-89c5ef692fd8',
        order_id: '225203bf-ab59-4650-9b82-bc3d18e44d47',
        product_id: 'ff1614e5-ae2e-4b31-b040-02a007128f10',
        quantity: 1,
        unit_price: 20000,
      },
      {
        id: 'e5ae674d-7b01-49c2-9170-9cf86f25211d',
        order_id: 'cb5b8324-0ca4-4f12-98ff-9cfd8be3ede2',
        product_id: 'e509abd9-20f2-4868-960a-7edb310009ff',
        quantity: 3,
        unit_price: 15000,
      },
      {
        id: '0cfd24db-8d41-4470-a16c-49a26bc799e2',
        order_id: 'a7e85af8-99d0-42fb-b8e8-49623086f6a3',
        product_id: '40405bf3-18f6-453a-afb4-a2dfbc6b892a',
        quantity: 1,
        unit_price: 15000,
      },
      {
        id: '348c8c83-78f8-4184-bd2e-88c1c0d97b1a',
        order_id: 'd7756c1f-2adb-4eee-a13e-b654c452d60d',
        product_id: '00ef2c29-d835-4cde-9fd8-30c0a910553b',
        quantity: 2,
        unit_price: 20000,
      },
      {
        id: '566ef486-d348-4ef2-bbf9-95a8bd2bff31',
        order_id: 'd7756c1f-2adb-4eee-a13e-b654c452d60d',
        product_id: '0df03cfc-a0bf-47d4-9961-ed5bc84738f3',
        quantity: 1,
        unit_price: 25000,
      },
    ]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("OrderItems", null, {});
  },
};