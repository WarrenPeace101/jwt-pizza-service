const express = require('express');
const config = require('../config.js');
const { Role, DB } = require('../database/database.js');
const { authRouter } = require('./authRouter.js');
const { asyncHandler, StatusCodeError } = require('../endpointHelper.js');
const metrics = require('../metrics.js');
const logger = require('../logger.js');

const orderRouter = express.Router();

orderRouter.endpoints = [
  {
    method: 'GET',
    path: '/api/order/menu',
    description: 'Get the pizza menu',
    example: `curl localhost:3000/api/order/menu`,
    response: [{ id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' }],
  },
  {
    method: 'PUT',
    path: '/api/order/menu',
    requiresAuth: true,
    description: 'Add an item to the menu',
    example: `curl -X PUT localhost:3000/api/order/menu -H 'Content-Type: application/json' -d '{ "title":"Student", "description": "No topping, no sauce, just carbs", "image":"pizza9.png", "price": 0.0001 }'  -H 'Authorization: Bearer tttttt'`,
    response: [{ id: 1, title: 'Student', description: 'No topping, no sauce, just carbs', image: 'pizza9.png', price: 0.0001 }],
  },
  {
    method: 'GET',
    path: '/api/order',
    requiresAuth: true,
    description: 'Get the orders for the authenticated user',
    example: `curl -X GET localhost:3000/api/order  -H 'Authorization: Bearer tttttt'`,
    response: { dinerId: 4, orders: [{ id: 1, franchiseId: 1, storeId: 1, date: '2024-06-05T05:14:40.000Z', items: [{ id: 1, menuId: 1, description: 'Veggie', price: 0.05 }] }], page: 1 },
  },
  {
    method: 'POST',
    path: '/api/order',
    requiresAuth: true,
    description: 'Create a order for the authenticated user',
    example: `curl -X POST localhost:3000/api/order -H 'Content-Type: application/json' -d '{"franchiseId": 1, "storeId":1, "items":[{ "menuId": 1, "description": "Veggie", "price": 0.05 }]}'  -H 'Authorization: Bearer tttttt'`,
    response: { order: { franchiseId: 1, storeId: 1, items: [{ menuId: 1, description: 'Veggie', price: 0.05 }], id: 1 }, jwt: '1111111111' },
  },
];

// getMenu
orderRouter.get(
  '/menu',
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    console.log(startTime);

    metrics.incrementGetRequests();
    metrics.incrementTotalRequests();

    res.send(await DB.getMenu());

    const endTime = Date.now();
    console.log(endTime);
    metrics.updateServiceEndpointLatency(endTime - startTime);
  })
);

// addMenuItem
orderRouter.put(
  '/menu',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    const startTime = Date.now();

    if (!req.user.isRole(Role.Admin)) {
      metrics.incrementTotalAuthFailures();
      throw new StatusCodeError('unable to add menu item', 403);
    }

    metrics.incrementPutRequests();
    metrics.incrementTotalRequests();

    const addMenuItemReq = req.body;
    await DB.addMenuItem(addMenuItemReq);

    metrics.incrementTotalAuthSuccesses();

    res.send(await DB.getMenu());

    const endTime = Date.now();
    metrics.updateServiceEndpointLatency(endTime - startTime);
  })
);

// getOrders
orderRouter.get(
  '/',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    const startTime = Date.now();

    metrics.incrementGetRequests();
    metrics.incrementTotalRequests();

    metrics.incrementTotalAuthSuccesses();

    res.json(await DB.getOrders(req.user, req.query.page));

    const endTime = Date.now();
    metrics.updateServiceEndpointLatency(endTime - startTime);

  })
);

// createOrder
orderRouter.post(
  '/',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    const startServiceTime = Date.now();

    metrics.incrementPostRequests();
    metrics.incrementTotalRequests();

    metrics.incrementTotalAuthSuccesses();

    const orderReq = req.body;
    const order = await DB.addDinerOrder(req.user, orderReq);

    const startPizzaTime = Date.now();
    const r = await fetch(`${config.factory.url}/api/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${config.factory.apiKey}` },
      body: JSON.stringify({ diner: { id: req.user.id, name: req.user.name, email: req.user.email }, order }),
    });
    const j = await r.json();
    if (r.ok) {
      createOrderMetrics(orderReq);
      const createPizzaReq = JSON.stringify({ diner: { id: req.user.id, name: req.user.name, email: req.user.email }, order });
      logger.sendPizzaToFactorySuccess(createPizzaReq);

      res.send({ order, jwt: j.jwt});
      //res.send({ order, jwt: j.jwt, reportUrl: j.reportUrl });

      const endServiceTime = Date.now();
      const endPizzaTime = Date.now();
      metrics.updateServiceEndpointLatency(endServiceTime - startServiceTime);
      metrics.updateCreatePizzaLatency(endPizzaTime - startPizzaTime);
    } else {
      metrics.incrementTotalAuthFailures();
      metrics.incrementNumPizzaCreationFailures();
      const createPizzaReq = JSON.stringify({ diner: { id: req.user.id, name: req.user.name, email: req.user.email }, order });
      logger.sendPizzaToFactoryFailure(createPizzaReq);

      res.status(500).send({ message: 'Failed to fulfill order at factory', reportUrl: j.reportUrl });

      const endServiceTime = Date.now();
      metrics.updateServiceEndpointLatency(endServiceTime - startServiceTime);
    }

  })
);

function createOrderMetrics(orderReq) {
  var itemList = orderReq.items;
  var totalPrice = 0;
  var numItems = 0;

  for (let item of itemList) {
    totalPrice += item.price;
    //console.log(totalPrice);
    numItems += 1;
  }

  metrics.increaseNumPizzasSold(numItems);
  metrics.increasePizzaRevenue(totalPrice);
};

module.exports = orderRouter;
