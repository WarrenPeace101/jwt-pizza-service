const request = require('supertest');
const app = require('../service');
const Role = require('../model/model.js')
const {DB} = require('../database/database.js')

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
const testAdmin = { name: 'bob', email: 'another@test.com', password: 'b', roles: [{ role: Role.Admin }]};
//const testBadUser = {name: ''}
let testUserAuthToken;

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

//this function registers a new user before every other test
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

test('login', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);

  const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
  expect(loginRes.body.user).toMatchObject(user);
});

test('login fail', async () => {
  testUser.email = null
  const loginRes = await request(app).put('/api/auth').send(testUser);
  expect(loginRes.status).toBe(404);
})
 

test('update user success', async () => {

  const adminUser = createAdminUser();
  const registerRes = await request(app).put('/api/auth').send(adminUser);
  const adminID = registerRes.body.user.id;
  const adminAuth = registerRes.body.token;

  const updateUserRes = await request(app).put(`/api/auth/:${adminID}`).set('Authorization', `Bearer ${adminAuth}`).send(adminUser);
  //console.log(`/api/auth/:${testUserID}`)
  expect(updateUserRes.status).toBe(200);

});

test('update user fail (no auth token)', async () => {
  const updateUserRes = await request(app).put(`/api/auth/:${testUserID}`).send(testUser);

  expect(updateUserRes.status).toBe(401);
})

test('logout user success', async () => {
  //login a user first
  const loginRes = await request(app).put('/api/auth').send(testUser);

  const deleteRes = await request(app).delete('/api/auth').set('Authorization', `Bearer ${testUserAuthToken}`).send(testUser);

  expect(deleteRes.status).toBe(200)
})

test('logout user fail (no auth token)', async () => {
  //login a user first
  const loginRes = await request(app).put('/api/auth').send(testUser);
  const deleteRes = await request(app).delete('/api/auth').send(testUser);

  expect(deleteRes.status).toBe(401)
})







