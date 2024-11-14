const config = require('./config.js');

class Logging() {
    constructor() {



        //periodic logging sent to Grafana
        // const timer = setInterval(() => {
            
      
        //   }, 15000);
        //   timer.unref();


    }

    sendLogToGrafana(event) {
        const body = JSON.stringify(event);
        fetch(`${config.logging.url}`, {
          method: 'post',
          body: body,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.logging.userId}:${config.logging.apiKey}`,
          },
        }).then((res) => {
          if (!res.ok) console.log('Failed to send log to Grafana');
        });
      }

}

const logging = new Logging();
module.exports = logging;

