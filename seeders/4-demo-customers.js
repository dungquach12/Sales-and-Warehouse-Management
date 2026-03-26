"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert("Customers", [
      {
        id: 'eff42d57-b096-4ef7-b341-7923f54e1844',
        name: "Anh Tú",
        phone: "0901234567",
        note: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'f9f9ffea-e076-42b0-af5d-304e38c37f9f',
        name: "Chị Mai",
        phone: "0912345678",
        note: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'f5dd11ea-2799-4d9c-907b-4557d289a797',
        name: "Bác Hùng",
        phone: null,
        note: "Khách quen",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'f0d8ced1-8c3a-4627-8da6-79c0156a4b3a',
        name: "Chị Lan",
        phone: "0934567890",
        note: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Customers", null, {});
  },
};