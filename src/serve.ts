import express, { Request } from 'express'
import expressWs from 'express-ws'
import { isFile, getSHA512 } from './common'
import { readFile } from 'fs-extra'

async function authorize(request: Request) {
  if (!request.body.id || !request.body.secret) {
    throw 'Bad request: Missing ID and/or secret'
  }

  if (!/^[a-zA-Z0-9\-_]+$/.test(request.body.id)) {
    throw 'Spooky request: ID is not path-safe'
  }
      
  if (!await isFile(`./identities/${request.body.id}`)) {
    throw 'Spooky request: Identity does not exist'
  }

  const secretHash = await readFile(`./identities/${request.body.id}`, { encoding: 'utf8' })

  if (getSHA512(request.body.secret) === secretHash) {
    return getSHA512(Date.now() + secretHash)
  }

  throw 'Spooky request: Invalid secret'
}

export async function serve() {
  const app = express()
  expressWs(app)

  app.use(express.json())

  app.post('/authorize', (request, response) => {
    authorize(request)
      .then(token => response.send({ token }))
      .catch(err => {
        console.log(`/authorize failed due to ${err}`)
        response.sendStatus(403)
      })
  })

  app.post('/deauthorize', (request, response) => {
    
  })

  app.listen(8080, () => console.log('Started'))

  return 0
}
