const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config.js');
const { StatusCodeError, asyncHandler } = require('../endpointHelper.js');
const { DB, Role } = require('../database/database.js');
const metrics = require('../metrics.js');
const logger = require('../logger.js');

const authRouter = express.Router();
var enableChaos;

authRouter.endpoints = [
  {
    method: 'POST',
    path: '/api/auth',
    description: 'Register a new user',
    example: `curl -X POST localhost:3000/api/auth -d '{"name":"pizza diner", "email":"d@jwt.com", "password":"diner"}' -H 'Content-Type: application/json'`,
    response: { user: { id: 2, name: 'pizza diner', email: 'd@jwt.com', roles: [{ role: 'diner' }] }, token: 'tttttt' },
  },
  {
    method: 'PUT',
    path: '/api/auth',
    description: 'Login existing user',
    example: `curl -X PUT localhost:3000/api/auth -d '{"email":"a@jwt.com", "password":"admin"}' -H 'Content-Type: application/json'`,
    response: { user: { id: 1, name: '常用名字', email: 'a@jwt.com', roles: [{ role: 'admin' }] }, token: 'tttttt' },
  },
  {
    method: 'PUT',
    path: '/api/auth/:userId',
    requiresAuth: true,
    description: 'Update user',
    example: `curl -X PUT localhost:3000/api/auth/1 -d '{"email":"a@jwt.com", "password":"admin"}' -H 'Content-Type: application/json' -H 'Authorization: Bearer tttttt'`,
    response: { id: 1, name: '常用名字', email: 'a@jwt.com', roles: [{ role: 'admin' }] },
  },
  {
    method: 'DELETE',
    path: '/api/auth',
    requiresAuth: true,
    description: 'Logout a user',
    example: `curl -X DELETE localhost:3000/api/auth -H 'Authorization: Bearer tttttt'`,
    response: { message: 'logout successful' },
  },
];

async function setAuthUser(req, res, next) {
  const token = readAuthToken(req);
  if (token) {
    try {
      if (await DB.isLoggedIn(token)) {
        // Check the database to make sure the token is valid.
        req.user = jwt.verify(token, config.jwtSecret);
        req.user.isRole = (role) => !!req.user.roles.find((r) => r.role === role);
        metrics.incrementTotalAuthSuccesses();
      }
    } catch {
      req.user = null;
      metrics.incrementTotalAuthFailures();
    }
  }
  next();
}

// Authenticate token
authRouter.authenticateToken = (req, res, next) => {
  if (!req.user) {
    metrics.incrementTotalAuthFailures();

    return res.status(401).send({ message: 'unauthorized' });
  }
  next();
};

// register
authRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    console.log(enableChaos);
    if (enableChaos != true) {
      metrics.incrementPostRequests();
      metrics.incrementTotalRequests();
      
      const startTime = Date.now();
    
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'name, email, and password are required' });
      }
      const user = await DB.addUser({ name, email, password, roles: [{ role: Role.Diner }] });
      const auth = await setAuth(user);

      metrics.incrementTotalAuthSuccesses();
      res.status
      res.json({ user: user, token: auth });

      const endTime = Date.now();
      metrics.updateServiceEndpointLatency(endTime - startTime);

      const logData = {
        authorized: !!req.headers.authorization,
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        reqBody: JSON.stringify(req.body),
        resBody: JSON.stringify(res.body),
      };
    logger.customHttpLogger(logData);
    }
    else {
      logger.chaosModeLogger("register user");
      res.json({chaosMode: "Sorry, you are having some chaos >:D"});
    }

    

  })
);

// login
authRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    metrics.incrementPutRequests();
    metrics.incrementTotalRequests();

    const startTime = Date.now();
    
    const { email, password } = req.body;
    const user = await DB.getUser(email, password);
    const auth = await setAuth(user);

    metrics.incrementTotalAuthSuccesses();
    metrics.incrementActiveUsers();

    res.json({ user: user, token: auth });

    const endTime = Date.now();
    metrics.updateServiceEndpointLatency(endTime - startTime);

  })
);

// logout
authRouter.delete(
  '/',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
   
    metrics.incrementDeleteRequests();
    metrics.incrementTotalRequests();
    metrics.decrementActiveUsers();

    const startTime = Date.now();

    await clearAuth(req);

    metrics.incrementTotalAuthSuccesses();

    res.json({ message: 'logout successful' });

    const endTime = Date.now();
    metrics.updateServiceEndpointLatency(endTime - startTime);

  })
);

// updateUser
authRouter.put(
  '/:userId',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    const startTime = Date.now();

    metrics.incrementPutRequests();
    metrics.incrementTotalRequests();
    
    const { email, password } = req.body;
    const userId = Number(req.params.userId);
    const user = req.user;
    if (user.id !== userId && !user.isRole(Role.Admin)) {
      metrics.incrementTotalAuthFailures();
      return res.status(403).json({ message: 'unauthorized' });
    }

    const updatedUser = await DB.updateUser(userId, email, password);
    metrics.incrementTotalAuthSuccesses();


    res.json(updatedUser);

    const endTime = Date.now();
    metrics.updateServiceEndpointLatency(endTime - startTime);

  })
);

//enables/disables chaos
authRouter.put(
  '/chaos/:state',
  authRouter.authenticateToken,
  asyncHandler(async (req, res) => {
    const startTime = Date.now();

    metrics.incrementPutRequests();
    metrics.incrementTotalRequests();

    //logger.chaosMode();
    
    if (!req.user.isRole(Role.Admin)) {
      metrics.incrementTotalAuthFailures();
      throw new StatusCodeError('unknown endpoint', 404);
    }

    enableChaos = req.params.state === 'true';
    metrics.setChaosSatus(enableChaos);
    metrics.chaosModeMetrics();
    
    res.json({ chaos: enableChaos });

    const endTime = Date.now();
    metrics.updateServiceEndpointLatency(endTime - startTime);
  })
);


async function setAuth(user) {
  const token = jwt.sign(user, config.jwtSecret);
  await DB.loginUser(user.id, token);
  return token;
}

async function clearAuth(req) {
  const token = readAuthToken(req);
  if (token) {
    await DB.logoutUser(token);
  }
}

function readAuthToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    return authHeader.split(' ')[1];
  }
  return null;
}

module.exports = { authRouter, setAuthUser };
