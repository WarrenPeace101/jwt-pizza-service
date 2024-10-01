const request = require('supertest');
const app = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
//const testAdmin = { name: 'bob', email: 'another@test.com', password: 'b', roles: [{ role: Role.Admin }]};
const newFranchise = {name: 'pizza pocket', admins: [{email: 'f@jwt.com'}]}

let testUserAuthToken;
const { Role, DB } = require('../database/database.js');

function randomName() {
    return Math.random().toString(36).substring(2, 12);
  }
  
async function createAdminUser() {
    let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
    user.name = randomName();
    user.email = user.name + '@admin.com';
  
    await DB.addUser(user);
  
    user.password = 'toomanysecrets';
    return user;
  }

beforeAll(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
    testUserID = registerRes.body.user.id

    /*testAdmin.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const adminRegisterRes = await request(app).post('/api/auth').send(testAdmin);
    testAdminAuthToken = adminRegisterRes.body.token;
    testAdminID = adminRegisterRes.body.user.id*/
  });

  test('list franchises', async () => {
    const listFranchiseRes = await request(app).get('/api/franchise').send(testUser);
    expect(listFranchiseRes.status).toBe(200)

  }) 

  test('get a users franchises', async () => {

    const getUserFranchisesRes = await request(app).get(`/api/franchise/${testUserID}`).set('Authorization', `Bearer ${testUserAuthToken}`).send(testUser);
    expect(getUserFranchisesRes.status).toBe(200)

  })

  test('create a new franchise', async () => {
    const adminUser = createAdminUser()

    const registerAdminRes = await request(app).post('/api/auth').send(adminUser);

    const adminToken = registerAdminRes.body.token;
    const adminID = registerAdminRes.body.user.id;


    const createFranchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${adminToken}`).send(newFranchise)
    expect(createFranchiseRes.status).toBe(200)
  })

  test('delete a franchise', async () => {
    const adminUser = createAdminUser()
    const registerAdminRes = await request(app).post('/api/auth').send(adminUser);
    const adminToken = registerAdminRes.body.token;
    const adminID = registerAdminRes.body.user.id;

    const newFranchise = {name: 'pizza pocket', admins: [{email: adminUser.email}]}

    //get a franchise id
    const getFranchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${adminToken}`).send(newFranchise)
    const franchiseID = getFranchiseRes.body.id

    const deleteRes = await request(app).delete(`/api/franchise/${franchiseID}').set('Authorization`, `Bearer ${adminToken}`);
  })

  test('create a franchise store', async () => {

    const adminUser = createAdminUser()
    const registerAdminRes = await request(app).post('/api/auth').send(adminUser);
    const adminToken = registerAdminRes.body.token;
    const adminID = registerAdminRes.body.user.id;

    //get a franchise id
    const getFranchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${adminToken}`).send(newFranchise)
    const franchID = getFranchiseRes.body.id
    const franchName = getFranchiseRes.body.name

    const franchiseStore = {franchiseID: franchID, name: franchName}

    const createFranchiseStoreRes = await request(app).post(`/api/franchise/${franchiseID}/store`).set('Authorization', `Bearer ${adminToken}`).send(franchiseStore)

  })

  test('delete a franchise store', async () => {
    
  })





