import Busboy from 'busboy'

export default class UploadHandler {
  constructor({ io, socketId, downloadsFolder }) {
    this.io = io
    this.socketId = socketId
    this.downloadsFolder = downloadsFolder
  }

  onFile(fieldname, file, filename) {

  }

  registerEvents(headers, onFinish) {
    const busboy = new Busboy({ headers })
    busboy.on('file', this.onFile.bind(this))
    busboy.on('finish', onFinish)

    return busboy
  }
}