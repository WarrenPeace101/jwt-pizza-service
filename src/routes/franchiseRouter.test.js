const request = require('supertest');
const app = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
//const testAdmin = { name: 'bob', email: 'another@test.com', password: 'b', roles: [{ role: Role.Admin }]};
//const newFranchise = {name: 'pizza pocket', admins: [{email: 'f@jwt.com'}]}

let testUserAuthToken;
const { Role, DB } = require('../database/database.js');

if (process.env.VSCODE_INSPECTOR_OPTIONS) {
  jest.setTimeout(60 * 1000 * 5); // 5 minutes
}

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

  async function createNewFranchise(adminUser) {
    let newFranchise = {name: randomName(), admins: [{email: adminUser.email}]}
    return newFranchise
  }

beforeAll(async () => {
    
  });

  test('list franchises', async () => {
    const listFranchiseRes = await request(app).get('/api/franchise');
    expect(listFranchiseRes.status).toBe(200)
  }) 

  test('get a users franchises', async () => {

    const adminUser = await createAdminUser();
    const loginAdminRes = await request(app).put('/api/auth').send(adminUser);
    const adminToken = loginAdminRes.body.token;
    const adminID = loginAdminRes.body.user.id;


    const newFranchise = await createNewFranchise(adminUser);
    const newFranchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${adminToken}`).send(newFranchise);
    const newFranchID = newFranchiseRes.body.id;

    const getUserFranchisesRes = await request(app).get(`/api/franchise/${adminID}`).set('Authorization', `Bearer ${adminToken}`).send(adminUser);
    expect(getUserFranchisesRes.status).toBe(200)
    //console.log(getUserFranchisesRes.body)
    //expect(getUserFranchisesRes.body)

  })

  test('create a new franchise', async () => {
    const adminUser = await createAdminUser()

    const loginAdminRes = await request(app).put('/api/auth').send(adminUser);

    const adminToken = loginAdminRes.body.token;
    const adminID = loginAdminRes.body.user.id;

    const newFranchise = await createNewFranchise(adminUser);

    const createFranchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${adminToken}`).send(newFranchise)

    expect(createFranchiseRes.status).toBe(200)
  })

  test('delete a franchise', async () => {
    const adminUser = await createAdminUser()
    const loginAdminRes = await request(app).put('/api/auth').send(adminUser);
    const adminToken = loginAdminRes.body.token;
    const adminID = loginAdminRes.body.user.id;

    const newFranchise = {name: 'pizza pocket', admins: [{email: adminUser.email}]}

    //get a franchise id
    const getFranchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${adminToken}`).send(newFranchise)
    const franchiseID = getFranchiseRes.body.id

    const deleteRes = await request(app).delete(`/api/franchise/${franchiseID}').set('Authorization`, `Bearer ${adminToken}`);
  })

  test('create a franchise store', async () => {

    const adminUser = await createAdminUser();
  
    //login
    const loginAdminRes = await request(app).put('/api/auth').send(adminUser);

    const adminToken = loginAdminRes.body.token;
    const adminID = loginAdminRes.body.user.id;

    const newFranchise = createNewFranchise(adminUser);
    //get a franchise id
    const getFranchiseRes = await request(app).post('/api/franchise').set('Authorization', `Bearer ${adminToken}`).send(newFranchise)
    const franchID = getFranchiseRes.body.id
    const franchName = getFranchiseRes.body.name

    const franchiseStore = {franchiseID: franchID, name: franchName}

    const createFranchiseStoreRes = await request(app).post(`/api/franchise/${franchID}/store`).set('Authorization', `Bearer ${adminToken}`).send(franchiseStore);
    expect(createFranchiseStoreRes).toBe(200);

  })

  test('delete a franchise store', async () => {
  
  })





