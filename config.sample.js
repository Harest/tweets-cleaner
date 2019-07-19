module.exports = {
  consumer_key: '##',
  consumer_secret: '##',
  access_token_key: '##',
  access_token_secret: '##',
  path: './tweet.js', // path to the archive .js file
  maxDate: false, // delete older than this eg: '2011-12-31T00:00:00+0000'
  saveRegexp: [], // save tweets matching this regexp: eg ['#newavatar', '@\w+']
  callsInterval: 500 // ms
}
