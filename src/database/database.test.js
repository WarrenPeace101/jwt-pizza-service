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
  
    //console.log(user);
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

  function createDinerOrder() {

    //let myOrder = {dinerId, franchiseId, storeId, date};


  }

   function createItem() {
   // let myItem = {name: randomName(), description: randomName(), image: randomName(), price : 1.99};
    let myItem = {orderId, menuId, description, price}
    return myItem;
  }



/*test('add menu item success', async () => {
    //const myItem = {title: "hot dog", description: "yum", image: "x", price: "1.99"}
    const myItem = createItem();

    const addMenuResult = DB.addMenuItem(myItem);
    
    expect(addMenuResult).not.toBeNull();
})*/

test('add user', async () => {
    //const franchisee = {name: "bob", email: "bob.com", password: "insecure", roles: [{ role: Role.Franchisee }] };
    //const addUserResult = DB.addUser(franchisee);

    const adminUser = await createAdminUser();
    
    //console.log(adminUser);
   // const franchiseeUser = await createFranchiseeUser()

    //const addAdminResult = DB.addUser(adminUser);
    //const addFranchiseeResult = DB.addUser(franchiseeUser)

    expect(adminUser).not.toBeNull();
})

test('update user', async () => {
    const adminUser = await createAdminUser();
    //const loginRes = await request(app).put('/api/auth').send(adminUser);

    //loginAuthToken = loginRes.body.token
    //loginRes.body.id

    const newUser = DB.updateUser(adminUser.id, adminUser.email, adminUser.password)

    expect(newUser).not.toBeNull()
})

/*test('add diner order', async () => {
const adminUser = await createAdminUser();

const myItem = createItem();

const addOrderRes = DB.addDinerOrder(adminUser, orderSample)
console.log(addOrderRes);

expect(addOrderRes).not.toBeNull()
})*/

//to do
test('get orders', async () => {
    console.log('get orders test');
    const adminUser = await createAdminUser();

    //console.log('db get orders test:');
    //console.log(adminUser);
    const databaseUser = await DB.getUser(adminUser.email, adminUser.password);
    console.log('database user: ' + databaseUser.body)

    const orderList = await DB.getOrders(databaseUser);

    expect(orderList).not.toBeNull();
})

test('insert new franchise', async () => {
    const adminUser = await createAdminUser()

    const createFranchiseRes = DB.createFranchise(newFranchise)

    expect(createFranchiseRes).not.toBeNull()
})

/*test('create franchise phony admin', async () => {
    //const adminUser = createAdminUser();

    //const createFranchRes = DB.createFranchise(fakeFranchise);

    expect(DB.createFranchise(fakeFranchise)).toThrow();
})*/

test('get a users franchise', async () => {

    const adminUser = await createAdminUser()

    const getFranchiseRes = DB.getUserFranchises(adminUser.id)

    expect(getFranchiseRes).not.toBeNull()
})

test('delete a franchise', async () => {
    const adminUser = await createAdminUser()



    const deleteFranchRes = DB.deleteFranchise()

    expect(deleteFranchRes.result).not.toBe(500)

})

test('get franchises admin user', async () => {
    const adminUser = await createAdminUser()

    const getFranchRes = DB.getFranchises(adminUser)

    expect(getFranchRes).not.toBeNull()
})

test('get franchises regular user', async () => {
    const getFranchRes = DB.getFranchises(testUser)
    expect(getFranchRes).not.toBeNull()
})

test('logout user', async () => {
    const adminUser = await createAdminUser();
    
    const loginRes = await request(app).put('/api/auth').send({email: adminUser.email, password: adminUser.password});

    adminToken = loginRes.body.token;
    console.log(adminToken);

    const loginCall = DB.loginUser(adminUser, adminToken);
    const logoutRes = DB.logoutUser(adminToken);
    expect(logoutRes).not.toBeNull();
})





