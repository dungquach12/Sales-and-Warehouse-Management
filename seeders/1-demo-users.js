'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Users', [
      {
        id: 'a2b7b0fc-3418-4bc0-bca6-26a0fb27c273',
        username: 'admin',
        name: 'Nguyễn Thị Nhung',
        email: 'admin@easymanage.com',
        password_hash: await bcrypt.hash('123456', 10),
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '656edf75-f3aa-47f4-a688-f97e0558d589',
        username: 'staff1',
        name: 'Quách Tấn Dũng',
        email: 'staff1@easymanage.com',
        password_hash: await bcrypt.hash('123456', 10),
        role: 'staff',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  }
};