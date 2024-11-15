const config = require('./config.js');
const os = require('os');

class Metrics {
  constructor() {
    this.totalRequests = 0;
    this.totalGetRequests = 0;
    this.totalPostRequests = 0;
    this.totalDeleteRequests = 0;
    this.totalPutRequests = 0;
    this.activeUsers = 0;
    this.authenticationSuccesses = 0;
    this.authenticationFailures = 0;
    this.numPizzasSold = 0;
    this.totalPizzaRevenue = 0;
    this.numPizzaCreationFailures = 0;
    this.serviceLatency = 0;
    this.pizzaCreationLatency = 0;

    // This will periodically sent metrics to Grafana
    /*const timer = setInterval(() => {
      this.sendHTTPrequests();

      this.sendMetricToGrafana('request', 'all', 'activeUsers', this.activeUsers);

      this.sendMetricToGrafana('request', 'all', 'authenticationSuccesses', this.authenticationSuccesses);
      this.sendMetricToGrafana('request', 'all', 'authenticationFailures', this.authenticationFailures);

      this.sendMetricToGrafana('request', 'all', 'cpu', this.getCpuUsagePercentage());
      this.sendMetricToGrafana('request', 'all', 'memory', this.getMemoryUsagePercentage());
      
      this.sendPizzaInfo();

      this.sendLatencyInfo();

    }, 15000);
    timer.unref();*/
  }

  sendHTTPrequests() {
    this.sendMetricToGrafana('request', 'all', 'total', this.totalRequests);
    this.sendMetricToGrafana('request', 'get', 'get', this.totalGetRequests);
    this.sendMetricToGrafana('request', 'post', 'post', this.totalPostRequests);
    this.sendMetricToGrafana('request', 'delete', 'delete', this.totalDeleteRequests);
    this.sendMetricToGrafana('request', 'put', 'put', this.totalPutRequests);
  }

  sendPizzaInfo() {
    this.sendMetricToGrafana('request', 'all', 'numPizzasSold', this.numPizzasSold);
    this.sendMetricToGrafana('request', 'all', 'numCreationFailures', this.numPizzaCreationFailures);
    this.sendMetricToGrafana('request', 'all', 'totalPizzaRevenue', this.totalPizzaRevenue);
  }

  sendLatencyInfo() {
    this.sendMetricToGrafana('request', 'all', 'serviceLatency', this.serviceLatency);
    this.sendMetricToGrafana('request', 'all', 'pizzaCreationLatency', this.pizzaCreationLatency);

  }

  incrementTotalRequests() {
    this.totalRequests++;
  }

  incrementGetRequests() {
    this.totalGetRequests++;
  }

  incrementPostRequests() {
    this.totalPostRequests++;
  }

  incrementDeleteRequests() {
    this.totalDeleteRequests++;
  }

  incrementPutRequests() {
    this.totalPutRequests++;
  }

  incrementActiveUsers() {
    this.activeUsers++;
  }

  decrementActiveUsers() {
    this.activeUsers--;
  }

  incrementTotalAuthFailures() {
    this.authenticationFailures++;
  }

  incrementTotalAuthSuccesses() {
    this.authenticationSuccesses++;
  }

  increaseNumPizzasSold(num) {
    this.numPizzasSold += num;
  }

  increasePizzaRevenue(amount) {
    this.totalPizzaRevenue += amount;
  }

  incrementNumPizzaCreationFailures() {
    this.numPizzaCreationFailures++;
  }

  updateCreatePizzaLatency(latencyVal) {
    this.pizzaCreationLatency = latencyVal;
  }

  updateServiceEndpointLatency(latencyVal) {
    this.serviceLatency = latencyVal;
  }

  sendMetricToGrafana(metricPrefix, httpMethod, metricName, metricValue) {
    const metric = `${metricPrefix},source=${config.metrics.source},method=${httpMethod} ${metricName}=${metricValue}`;

    fetch(`${config.metrics.url}`, {
      method: 'post',
      body: metric,
      headers: { Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}` },
    })
      .then((response) => {
        if (!response.ok) {
          console.error('Failed to push metrics data to Grafana');
        } else {
          console.log(`Pushed ${metric}`);
        }
      })
      .catch((error) => {
        console.error('Error pushing metrics:', error);
      });
  }

  getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return cpuUsage.toFixed(2) * 100;
  }
  
  getMemoryUsagePercentage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    return memoryUsage.toFixed(2);
  }

}


const metrics = new Metrics();
module.exports = metrics;
