import { makeUser } from './make-user'
import { serve } from './serve'

(async () => {
  if (['--make-user', '-u'].indexOf(process.argv[2]) >= 0) {
    if (process.argv.length < 3) {
      console.log('Usage:  bus --make-user <id>')
    }
    process.exit(await makeUser(process.argv[3]))
  } else {
    process.exit(await serve())
  }
})()
