const request = require('supertest');
const { DB, Role } = require('./database.js')

//const app = require('../service');
//const DB = require('../database.js')



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
    
})

//test('')

