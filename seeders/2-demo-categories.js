'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Categories', [
      {
        id: '78da132a-8128-4399-981d-9e76c7c1316c',
        name: 'Cà phê',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'bf16858e-207b-433b-ba36-9d464cab27dc',
        name: 'Trà',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '1a216afe-afd0-4c41-820f-87cb9a343cd4',
        name: 'Nước ép',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '9b8b6c67-5fd4-476f-99fb-ab91c5701dcc',
        name: 'Nước sâm',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '91a77013-17bb-4319-b5a6-5b1e1edb9eab',
        name: 'Rau má',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '963ef580-9d7c-4e6c-a50a-c738416387f2',
        name: 'Khác',
        created_at: new Date(),
        updated_at: new Date()
      },
    ]);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Categories', null, {});
  }
};