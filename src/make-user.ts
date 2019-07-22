import { getSHA512, Config } from './common'
import { S3 } from 'aws-sdk'
import { randomBytes } from 'crypto'

export async function makeUser(config: Config, s3: S3, id: string) {
  if (!/^[a-zA-Z0-9\-_]+$/.test(id)) {
    console.log(`'${id}' is not a valid identity. Identities may only contain alphanumeric characters, hyphens, and underscores.`)
    return 1
  }

  try {
    const salt = randomBytes(256).toString('base64')
    const secret = randomBytes(256).toString('base64')
    const hash = getSHA512(salt + secret)

    await s3.putObject({
      Bucket: config.identityBucketName,
      Key: id,
      Body: `${hash}:${salt}`
    }).promise()

    console.log('Keep this key in a safe place, since it can only be printed here once:')
    console.log(secret)
  } catch (err) {
    console.log(`Couldn't create identity due to ${err}`)
    return 1
  }

  return 0
}
