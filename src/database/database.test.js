const request = require('supertest');
const { DB, Role } = require('./database.js')
const app = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
const orderSample = {franchiseId: 1, storeId:1, items:[{ menuId: 1, description: "Veggie", price: 0.05 }]}
const newFranchise = {name: 'pizza pocket', admins: [{email: 'f@jwt.com'}]}
const fakeFranchise = {name: 'pizza pocket 2', admins: [{email: 'hahaha@hack.com'}]}


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

  async function createFranchiseeUser() {
    let user = { password: 'toomanysecrets', roles: [{ role: Role.Franchisee }] };
    user.name = randomName();
    user.email = user.name + '@franchisee.com';
  
    await DB.addUser(user);
  
    user.password = 'toomanysecrets';
    return user;
  }

  async function createItem() {
    let myItem = {name: randomName(), description: randomName(), image: randomName(), price : 1.99};
    return myItem;
  }



test('add menu item success', async () => {
    //const myItem = {title: "hot dog", description: "yum", image: "x", price: "1.99"}
    const myItem = createItem();

    const addMenuResult = DB.addMenuItem(myItem);
    
    expect(addMenuResult).not.toBeNull();
})

test('add user', async () => {
    //const franchisee = {name: "bob", email: "bob.com", password: "insecure", roles: [{ role: Role.Franchisee }] };
    //const addUserResult = DB.addUser(franchisee);

    const adminUser = createAdminUser();
   // const franchiseeUser = await createFranchiseeUser()

    const addAdminResult = DB.addUser(adminUser);
    //const addFranchiseeResult = DB.addUser(franchiseeUser)

    expect(addAdminResult).not.toBeNull();
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

/*test('create franchise phony admin', async () => {
    //const adminUser = createAdminUser();

    //const createFranchRes = DB.createFranchise(fakeFranchise);

    expect(DB.createFranchise(fakeFranchise)).toThrow();
})*/

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





