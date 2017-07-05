const { BaseKonnector, filterData, saveData } = require('cozy-konnector-libs')
let request = require('request-promise')
// require('request-debug')(request)

const DOCTYPE = 'io.cozy.mastodonstatuses'

module.exports = new BaseKonnector(fields => {
  // first get the access token
  const {client_id, client_secret, username, password} = fields
  return request({
    method: 'POST',
    json: true,
    uri: `${fields.url}/oauth/token`,
    form: { client_id, client_secret, username, password, grant_type: 'password' }
  })
  .then(body => {
    return request({
      headers: {
        'Authorization': `Bearer ${body.access_token}`
      },
      json: true,
      uri: `${fields.url}/api/v1/timelines/home`
    })
  })
  .then(toots => filterData(toots, DOCTYPE, {keys: ['id']}))
  .then(toots => saveData(toots, DOCTYPE))
  .catch(err => console.error(err))
})
