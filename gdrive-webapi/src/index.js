import https from 'https'
import http from 'http'
import fs from 'fs'
import { logger } from './logger.js'
import { Server } from 'socket.io'
import Routes from './routes.js'

const PORT = process.env.PORT || 3000

const localHostSSL = {
  key: fs.readFileSync('./certificates/key.pem'),
  cert: fs.readFileSync('./certificates/cert.pem')
}

const isProduction = process.env.NODE_ENV === 'production'
process.env.USER = process.env.USER ?? 'system_user'

const protocol = isProduction ? http : https
const sllConfig = isProduction ? {} : localHostSSL


const routes = new Routes()
const server = protocol.createServer(
  sllConfig,
  routes.handler.bind(routes)
)

const io = new Server(server, {
  cors: {
    origin: '*',
    credentials: false
  }
})

routes.setSocketInstance(io)
io.on('connection', (socket) => logger.info(`someone connected ${socket.id}`))

const startServer = () => {
  const { address, port } = server.address()
  const logProtocol = isProduction ? 'http' : 'https'
  logger.info(`app running at ${logProtocol}://${address}:${port}`)
}

server.listen(PORT, startServer)