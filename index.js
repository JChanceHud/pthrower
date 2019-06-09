const jwt = require('jwt-simple')
const axios = require('axios')
const asyncExpress = require('async-express')
const express = require('express')

const app = express()
app.use(express.json())

app.use((_, res, next) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE, PUT')
  res.set('Access-Control-Allow-Headers', 'content-type')
  next()
})

async function generateToken() {
  const now = Math.round(new Date() / 1000)
  const expiration = now + 60
  const token = jwt.encode({
    iat: now,
    exp: expiration,
    iss: process.env.APP_ID,
  }, process.env.APP_CERT, 'RS256')
  const { data } = await axios.post(`https://api.github.com/installations/${process.env.INSTALLATION_ID}/access_tokens`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.machine-man-preview+json',
    },
  })
  return data.token
}

app.post('/', asyncExpress(async (req, res) => {
  const { commit, repoSlug, pullNumber, apkUrl } = req.body
  const { data } = await axios.post(`https://api.github.com/repos/${repoSlug}/issues/${pullNumber}/comments`, {
    body: `Download the built apk for \`${commit.slice(0, 7)}\` [here](${apkUrl}).`,
  }, {
    headers: {
      Authorization: `token ${await generateToken()}`,
      Accept: 'application/vnd.github.machine-man-preview+json',
    },
  })
  res.end()
}))

module.exports = app
