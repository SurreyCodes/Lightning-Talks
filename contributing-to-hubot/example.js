'use strict';

const Redis = require('redis');
const RedisUrl = require('redis-url');

class Welcome {
  constructor(hubot) {
    this.hubot = hubot;
    this.redis = null;

    this.hubot.enter(this.onJoin.bind(this));
  }

  initialize() {
    // an environment variable is used here as opposed to harcoding the string because it'll differ between
    // running on a local machine and after deployment to heroku. this follows the 12 factor principles for config:
    // https://12factor.net/config.
    if (process.env.REDIS_URL) {
      let parts = RedisUrl.parse(process.env.REDIS_URL);
      let opts = { password: parts.password || null, db: parts.database || null };

      // try to set the redis client. if there's an error, log it so that we can check out what's going on.
      try {
        this.redis = Redis.createClient(parts.port, parts.hostname, opts);
      } catch(err) {
        this.hubot.logger.error(err);
      }
    }
  }

  onJoin(resp) {
    this.redis.sismember('welcome', resp.message.user.name, (err, isMember) => {
      if (isMember) {
        this.hubot.logger.info(`Already welcomed ${resp.message.user.name}`);
        return;
      }

      resp.send(`Hello @${resp.message.user.name}, welcome to the community! Say hi @channel`);
      this.hubot.send({room: resp.message.user.id}, 'Hey there, please upload a picture and fill out your bio');
      this.redis.sadd('welcome', resp.message.user.name);
    });
  }
}

module.exports = (robot) => {
  let welcome = new Welcome(robot);
  welcome.initialize();
}
