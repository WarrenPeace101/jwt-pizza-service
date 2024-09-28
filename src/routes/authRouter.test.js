const request = require('supertest');
const app = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
//const testBadUser = {name: ''}
let testUserAuthToken;

//this function registers a new user before every other test
beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserAuthToken = registerRes.body.token;
  testUserID = registerRes.body.user.id
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
 

/*test('update user success', async () => {
  //const testUserID = registerRes.body.user.id
  //logs in user first
 // const loginRes = await request(app).put('/api/auth').send(testUser);
 // const loginUserID = loginRes.body.id
  //const authToken = loginRes.body.token

  const updateUserRes = await request(app).put(`/api/auth/:${testUserID}`).set('Authorization', `Bearer ${testUserAuthToken}`).send(testUser);
  console.log(`/api/auth/:${testUserID}`)

  expect(updateUserRes.status).toBe(200);

});*/

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







