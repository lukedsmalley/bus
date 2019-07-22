import { makeUser } from './make-user'
import { serve } from './serve'
import { inputYAML, Config } from './common'
import { S3 } from 'aws-sdk'

(async () => {
  const config = await inputYAML<Config>('./config.yml', {
    awsAccessKeyID: 'unspecified',
    awsEndpoint: 'unspecified',
    awsSecretAccessKey: 'unspecified',
    identityBucketName: 'unspecified',
    port: 8080
  })

  const s3 = new S3({
    endpoint: config.awsEndpoint || undefined,
    accessKeyId: config.awsAccessKeyID,
    secretAccessKey: config.awsSecretAccessKey
  })

  if (['--make-user', '-u'].indexOf(process.argv[2]) >= 0) {
    if (process.argv.length < 3) {
      console.log('Usage:  furugoori --make-user <id>')
    }
    process.exit(await makeUser(config, s3, process.argv[3]))
  } else {
    process.exit(await serve(config, s3))
  }
})()
  .catch(err => console.log(`(Unhandled) ${err}`))
