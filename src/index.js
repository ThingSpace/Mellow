import dotenv from 'dotenv'
import Mellow from './class/client.js'
import { startServer } from './server/index.js'
import { log } from './functions/logger.js'

dotenv.config()

const client = new Mellow()

client.start()
startServer(client)

process.on('unhandledRejection', (reason, promise) => {
    log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error')
})
process.on('uncaughtException', error => {
    log(`Uncaught Exception: ${error}`, 'error')
})
