"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert("Orders", [
      {
        id: 'e7130ab4-8249-4155-9b80-39be470676a9',
        user_id: 'a2b7b0fc-3418-4bc0-bca6-26a0fb27c273',
        customer_id: 'eff42d57-b096-4ef7-b341-7923f54e1844',
        customer_name: "Anh Tú",
        payment_method: "Tiền mặt",
        order_method: "Tại chỗ",
        total_price: 30000,
        status: "completed",
        created_at: new Date(),
      },
      {
        id: '225203bf-ab59-4650-9b82-bc3d18e44d47',
        user_id: 'a2b7b0fc-3418-4bc0-bca6-26a0fb27c273',
        customer_id: 'f9f9ffea-e076-42b0-af5d-304e38c37f9f',
        customer_name: "Chị Mai",
        payment_method: "Chuyển khoản",
        order_method: "Mang đi",
        total_price: 38000,
        status: "completed",
        created_at: new Date(),
      },
      {
        id: 'cb5b8324-0ca4-4f12-98ff-9cfd8be3ede2',
        user_id: 'a2b7b0fc-3418-4bc0-bca6-26a0fb27c273',
        customer_id: null,
        customer_name: null,
        payment_method: "Tiền mặt",
        order_method: "Tại chỗ",
        total_price: 45000,
        status: "completed",
        created_at: new Date(),
      },
      {
        id: 'a7e85af8-99d0-42fb-b8e8-49623086f6a3',
        user_id: 'a2b7b0fc-3418-4bc0-bca6-26a0fb27c273',
        customer_id: 'f5dd11ea-2799-4d9c-907b-4557d289a797',
        customer_name: "Bác Hùng",
        payment_method: "Tiền mặt",
        order_method: "Tại chỗ",
        total_price: 15000,
        status: "completed",
        created_at: new Date(),
      },
      {
        id: 'd7756c1f-2adb-4eee-a13e-b654c452d60d',
        user_id: 'a2b7b0fc-3418-4bc0-bca6-26a0fb27c273',
        customer_id: 'f0d8ced1-8c3a-4627-8da6-79c0156a4b3a',
        customer_name: "Chị Lan",
        payment_method: "Chuyển khoản",
        order_method: "Giao hàng",
        total_price: 65000,
        status: "completed",
        created_at: new Date(),
      },
    ]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Orders", null, {});
  },
};
