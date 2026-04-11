'use strict';
const argon2 = require("argon2");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Users', [
      {
        id: 'a2b7b0fc-3418-4bc0-bca6-26a0fb27c273',
        username: 'admin',
        name: 'Nguyễn Thị Nhung',
        email: 'admin@easymanage.com',
        password_hash: await argon2.hash('123456'),
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: '656edf75-f3aa-47f4-a688-f97e0558d589',
        username: 'staff1',
        name: 'Quách Tấn Dũng',
        email: 'staff1@easymanage.com',
        password_hash: await argon2.hash('123456'),
        role: 'staff',
        created_at: new Date(),
        updated_at: new Date(),
      }
    ]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  }
};