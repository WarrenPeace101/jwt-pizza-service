const config = require('./config.js');

class Logger {

    httpLogger = (req, res, next) => {
        let send = res.send;
        res.send = (resBody) => {
          const logData = {
            authorized: !!req.headers.authorization,
            path: req.path,
            method: req.method,
            statusCode: res.statusCode,
            reqBody: JSON.stringify(req.body),
            resBody: JSON.stringify(resBody),
          };
          const level = this.statusToLogLevel(res.statusCode);
          this.log(level, 'http', logData);
          res.send = send;
          return res.send(resBody);
        };
        next();
    };

    log(level, type, logData) {
        const labels = { component: config.source, level: level, type: type };
        const values = [this.nowString(), this.sanitize(logData)];
        const logEvent = { streams: [{ stream: labels, values: [values] }] };

        console.log("log event");
        console.log(logEvent);
        this.sendLogToGrafana(logEvent);
    }
    
    statusToLogLevel(statusCode) {
        if (statusCode >= 500) return 'error';
        if (statusCode >= 400) return 'warn';
        return 'info';
    }

    nowString() {
        return (Math.floor(Date.now()) * 1000000).toString();
    }

    sanitize(logData) {
        logData = JSON.stringify(logData);
        return logData.replace(/\\"password\\":\s*\\"[^"]*\\"/g, '\\"password\\": \\"*****\\"');
    }

    sendLogToGrafana(event) {
        console.log('in send log');
        const body = JSON.stringify(event);
        console.log(body);
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

const logger = new Logger();
module.exports = logger;

