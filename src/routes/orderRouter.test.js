const request = require('supertest');
const app = require('../service');
const {DB, Role} = require('../database/database.js')

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
//const menuItem = { title:"Student", description: "No topping, no sauce, just carbs", image:"pizza9.png", price: 0.0001};
const orderSample = {franchiseId: 1, storeId:1, items:[{ menuId: 1, description: "Veggie", price: 0.05 }]}

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

  async function createItem() {
    let myItem = {title: randomName(), description: randomName(), image: randomName(), price : 1.99};
    return myItem;
  }

//registers a new user before each test
beforeAll(async () => {
    //testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    //const registerRes = await request(app).post('/api/auth').send(testUser);
    //testUserAuthToken = registerRes.body.token;
    //testUserID = registerRes.body.user.id
  });

test('get menu success', async () => {
    const getMenuRes = await request(app).get('/api/order/menu');
    expect(getMenuRes.status).toBe(200);
})

test('add item to menu success', async () => {
    const adminUser = await createAdminUser();
    //console.log(adminUser)
    //const registerRes = await request(app).post('/api/auth').send(adminUser);

    //loginAuthToken = registerRes.body.token

    const loginRes = await request(app).put('/api/auth').send({email: adminUser.email, password: adminUser.password});
    
    const loginAuthToken = loginRes.body.token
    //console.log(loginAuthToken)

    const menuItem = await createItem()
    const addItemRes = await request(app).put('/api/order/menu').set('Authorization', `Bearer ${loginAuthToken}`).send(menuItem);

    expect(addItemRes.status).toBe(200);
})

test('add item to menu fail (no auth token)', async () => {
    const menuItem = await createItem()

    const addItemRes = await request(app).put('/api/order/menu').send(menuItem);
    expect(addItemRes.status).toBe(401);
})

test('get order for authenticated user', async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    await request(app).post('/api/auth').send(testUser);
    //const testUserAuthToken = registerRes.body.token;
    //const testUserID = registerRes.body.user.id
    
    const loginRes = await request(app).put('/api/auth').send(testUser);
    const loginAuthToken = loginRes.body.token

    const getOrdersRes = await request(app).get('/api/order').set('Authorization', `Bearer ${loginAuthToken}`);

    expect(getOrdersRes.status).toBe(200);
})

test('get order for authenticated user fail (no auth token)', async () => {
    //const loginRes = await request(app).put('/api/auth').send(testUser);
    //const loginAuthToken = loginRes.body.token

    const getOrdersRes = await request(app).get('/api/order');

    expect(getOrdersRes.status).toBe(401);
})

test('create order for authenticated user', async () => {
    const adminUser = await createAdminUser()

    const loginRes = await request(app).put('/api/auth').send(adminUser);
    const loginAuthToken = loginRes.body.token

    const createOrderRes = await request(app).post('/api/order').set('Authorization', `Bearer ${loginAuthToken}`).send(orderSample);
    expect(createOrderRes.status).toBe(200);

})

test('create order for not authenticated user', async () => {
    await request(app).put('/api/auth').send(testUser);
    //const loginAuthToken = loginRes.body.token

    const createOrderRes = await request(app).post('/api/order').send(orderSample);
    expect(createOrderRes.status).toBe(401);
})






