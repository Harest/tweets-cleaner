'use strict'

const chalk = require('chalk')
const Twitter = require('twitter')
const jsonfile = require('jsonfile')
const config = require('./config')

const logFile = config.log || './log.json'
let log
try {
  log = require(logFile)
} catch (e) {
  console.log(chalk.cyan('No log file, starting a fresh delete cycle.'))
  log = []
}

let maxDate = config.maxDate ? new Date(config.maxDate) : new Date()

const client = new Twitter({
  consumer_key: config.consumer_key,
  consumer_secret: config.consumer_secret,
  access_token_key: config.access_token_key,
  access_token_secret: config.access_token_secret
})

jsonfile.readFile(config.path, (err, json) => {
  if (err || !json) {
    return console.log(chalk.red('NO VALID JSON FILE! Be sure the first line of your tweet.js file is only a ['))
  }

  const logIds = log.map(l => l.id_str)
  const tweets = json.filter(t => {
    const hasId = !isNaN(parseInt(t.id_str))
    const oldEnough = new Date(t.created_at) < maxDate
    const shouldBeSaved = config.saveRegexp.some((regexp) => new RegExp(regexp).test(t.full_text))
    const notDeleted = logIds.indexOf(t.id_str) === -1
    return hasId && oldEnough && notDeleted && !shouldBeSaved
  })

  if (!tweets || !tweets.length) {
    return console.log(chalk.green('No more tweets to delete!'))
  }

  console.log(chalk.green(`Starting tweets cleaner on ${Date.now()} - Deleting tweets older than ${maxDate}`))
  deleteTweet(tweets, 0)
})

function deleteTweet (tweets, i) {
  let next = config.callsInterval
  let remaining = 0

  client.post('statuses/destroy', {id: tweets[i].id_str}, function (err, t, res) {
    remaining = parseInt(res.headers['x-rate-limit-remaining'])

    if (!isNaN(remaining) && remaining === 0) {
      console.log(chalk.cyan('Waiting'))
      next = parseInt(res.headers['x-rate-limit-reset']) - Date.now()
    } else {
      if (err) {
        console.log(chalk.yellow(JSON.stringify(err)))
      } else {
        log.push(tweets[i])
        console.log(chalk.green(`Deleted -> ${tweets[i].id_str} | ${tweets[i].full_text}`))
      }
    }

    jsonfile.writeFile(logFile, log, {spaces: 2}, function (err) {
      if (err) {
        return console.log(chalk.red('ERROR WRITING JSON!'))
      }

      if (i + 1 === tweets.length) {
        return console.log(chalk.green('Done!'))
      }

      console.log(chalk.green(`Next call in ${next}ms`))
      setTimeout(function () {
        deleteTweet(tweets, i + 1)
      }, next)
    })
  })
}
