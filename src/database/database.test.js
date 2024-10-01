const request = require('supertest');
const { DB, Role } = require('./database.js')
const app = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
const orderSample = {franchiseId: 1, storeId:1, items:[{ menuId: 1, description: "Veggie", price: 0.05 }]}
const newFranchise = {name: 'pizza pocket', admins: [{email: 'f@jwt.com'}]}


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

test('add menu item success', async () => {
    const myItem = {title: "hot dog", description: "yum", image: "x", price: "1.99"}

    const addMenuResult = DB.addMenuItem(myItem);
    

    expect(addMenuResult).not.toBeNull();
})

test('add user', async () => {
    const franchisee = {name: "bob", email: "bob.com", password: "insecure", roles: [{ role: Role.Franchisee }] };
    const addUserResult = DB.addUser(franchisee);
    expect(addUserResult).not.toBeNull();
})

test('update user', async () => {
    const adminUser = createAdminUser()
    //const loginRes = await request(app).put('/api/auth').send(adminUser);

    //loginAuthToken = loginRes.body.token
    //loginRes.body.id

    const newUser = DB.updateUser(adminUser.id, adminUser.email, adminUser.password)

    expect(newUser).not.toBeNull()
})

test('add diner order', async () => {
const adminUser = createAdminUser()

const addOrderRes = DB.addDinerOrder(adminUser, orderSample)

expect(addOrderRes).not.toBeNull()

})

//to do
test('get orders', async () => {
    const adminUser = createAdminUser()

    const orderList = DB.getOrders(adminUser)

    expect(orderList).not.toBeNull()
})

test('insert new franchise', async () => {
    const adminUser = createAdminUser()

    const createFranchiseRes = DB.createFranchise(newFranchise)

    expect(createFranchiseRes).not.toBeNull()
})

test('get a users franchise', async () => {

    const adminUser = createAdminUser()

    const getFranchiseRes = DB.getUserFranchises(adminUser.id)

    expect(getFranchiseRes).not.toBeNull()
})

test('delete a franchise', async () => {
    const adminUser = createAdminUser()

    const deleteFranchRes = DB.deleteFranchise()

    expect(deleteFranchRes.result).not.toBe(500)

})

test('get franchises admin user', async () => {
    const adminUser = createAdminUser()

    const getFranchRes = DB.getFranchises(adminUser)

    expect(getFranchRes).not.toBeNull()
})

test('get franchises regular user', async () => {
    const getFranchRes = DB.getFranchises(testUser)
    expect(getFranchRes).not.toBeNull()
})





