const { BaseKonnector, log, filterData, addData, request } = require('cozy-konnector-libs')

const DOCTYPE = 'io.cozy.mastodonstatuses'

const rq = request()

module.exports = new BaseKonnector(function (fields) {
  // first get the access token
  log('info', 'Getting the access token')
  const {client_id, client_secret, username, password} = fields
  return rq({
    method: 'POST',
    uri: `${fields.url}/oauth/token`,
    form: { client_id, client_secret, username, password, grant_type: 'password' }
  })
  .then(body => {
    log('info', 'Getting the list of toots')
    const { lastTootId } = this.getAccountData()
    log('debug', lastTootId, 'got this last toot id from account data')

    return rq({
      headers: {
        'Authorization': `Bearer ${body.access_token}`
      },
      qs: {
        since_id: lastTootId
      },
      uri: `${fields.url}/api/v1/timelines/home`
    })
  })
  .then(toots => {
    log('info', 'Filtering the already existing toots')
    return filterData(toots, DOCTYPE, {keys: ['id']})
  })
  .then(toots => {
    log('info', 'Putting the toots in the db')
    return addData(toots, DOCTYPE)
  })
  .then(toots => {
    if (toots.length) {
      log('info', 'Remembering the last toot id for next time')
      const lastTootId = toots[0].id
      log('debug', lastTootId, 'saving new last toot id')
      return this.saveAccountData({lastTootId})
    }
  })
  .catch(err => console.error(err))
})
