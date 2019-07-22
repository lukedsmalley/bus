import express, { Request, Response, NextFunction } from 'express'
import expressWs from 'express-ws'
import { getSHA512, Config } from './common'
import { S3 } from 'aws-sdk'
import passport from 'passport'
import { BasicStrategy } from 'passport-http';

export function serve(config: Config, s3: S3): Promise<number> {
  const app = expressWs(express()).app

  passport.use(new BasicStrategy((id, secret, done) => {
    console.log(`auth-v1   Authorization request with credentials for '${id}'`)

    if (!/^[a-zA-Z0-9\-_]+$/.test(id)) {
      console.log('auth-v1   Spooky request: ID is not path-safe')
      done('Spooky request: ID is not path-safe')
    }

    s3.getObject({
      Bucket: config.identityBucketName,
      Key: id
    }, (err, data) => {
      if (err) {
        console.log(`auth-v1   Failed to get secret from bucket due to ${err}`)
        done(err)
      }

      if (!data.Body) {
        console.log(`auth-v1   Failed to get secret from bucket: No object body retrieved`)
        done('Error: No object body retrieved')
      }

      const salt = data.Body!.toString('utf8').split(':')[0]
      const hash = data.Body!.toString('utf8').split(':')[1]

      if (getSHA512(salt + secret) !== hash) {
        console.log(`auth-v1   Failed to get secret from bucket due to ${err}`)
        done(null, false)
      }

      done(null, id)
    })
  }))

  const authAttempts: { [ip: string]: number } = {}

  function rateLimitHandler(request: Request, response: Response, next: NextFunction) {
    if (authAttempts[request.ip] && authAttempts[request.ip] > Date.now() + 1000) {
      response.sendStatus(403)
      return
    }

    authAttempts[request.ip] = Date.now()
    next()
  }

  const sessionIPs: { [id: string]: string} = {}

  function ipLimitHandler(request: Request, response: Response, next: NextFunction) {
    if (sessionIPs[request.user] && sessionIPs[request.user] !== request.ip) {
      console.log(`auth-v1   Spooky request: Authorization requested for '${request.user}'` +
          `by ${request.ip} when ${sessionIPs[request.user]} is already authorized`)
      response.sendStatus(403)
      return
    }

    sessionIPs[request.user] = request.ip
    console.log(`auth-v1   ${request.ip} authorized as ${request.user}`)
    next()
  }

  app.use('/socket/v1', rateLimitHandler, passport.authenticate('basic'), ipLimitHandler)

  app.ws('/socket/v1', (socket, request) => {
    socket.on('close', (code, reason) => {
      delete sessionIPs[request.user]
    })
  })

  return new Promise((resolve, reject) => {
    app.listen(config.port, () => console.log('Started'))
      .on('close', () => resolve(0))
  })
}
