const { BaseKonnector, log, filterData, addData } = require('cozy-konnector-libs')
let request = require('request-promise')
// require('request-debug')(request)

const DOCTYPE = 'io.cozy.mastodonstatuses'

module.exports = new BaseKonnector(function (fields) {
  // first get the access token
  const {client_id, client_secret, username, password} = fields
  return request({
    method: 'POST',
    json: true,
    uri: `${fields.url}/oauth/token`,
    form: { client_id, client_secret, username, password, grant_type: 'password' }
  })
  .then(body => {
    const { lastTootId } = this.getAccountData()
    log('debug', lastTootId, 'got this last toot id from account data')

    return request({
      headers: {
        'Authorization': `Bearer ${body.access_token}`
      },
      qs: {
        since_id: lastTootId
      },
      json: true,
      uri: `${fields.url}/api/v1/timelines/home`
    })
  })
  .then(toots => filterData(toots, DOCTYPE, {keys: ['id']}))
  .then(toots => addData(toots, DOCTYPE))
  .then(toots => {
    if (toots.length) {
      const lastTootId = toots[0].id
      log('debug', lastTootId, 'saving new last toot id')
      return this.saveAccountData({lastTootId})
    }
  })
  .catch(err => console.error(err))
})
