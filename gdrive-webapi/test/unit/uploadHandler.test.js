import {
  describe,
  test,
  expect,
  jest,
  beforeEach
} from '@jest/globals'
import fs from 'fs'
import { pipeline } from 'stream/promises'
import UploadHandler from '../../src/uploadHandler.js'
import TestUtil from '../_util/testUtil.js'
import { logger } from '../../src/logger'

describe('UploadHandler', () => {
  const ioObj = {
    to: (id) => ioObj,
    emit: (event, message) => {}
  }

  beforeEach(() => jest.spyOn(logger, 'info').mockImplementation())
  
  describe('registerEvents', () => {
    test('should call onFile functions on Busboy instance', () => {
      const uploadHandler = new UploadHandler({
        to: ioObj,
        socketId: '01'
      })

      jest.spyOn(uploadHandler, uploadHandler.onFile.name)
        .mockResolvedValue()

      const headers = {
        'content-type': 'multipart/form-data; boundary='
      }

      const onFinish = jest.fn()
      const busboyInstance = uploadHandler.registerEvents(headers, onFinish)

      const fileStream = TestUtil.generateReadableStream(['chunk', 'of', 'data'])
      busboyInstance.emit('file', 'fieldname', fileStream, 'filename.txt')
      busboyInstance.listeners('finish')[0].call()
      
      expect(uploadHandler.onFile).toHaveBeenCalled()
      expect(onFinish).toHaveBeenCalled()
    })
  })

  describe('onFile', () => {
    test('given a stream file it should save it on disk', async () => {
      const chunks = ['hey', 'dude']
      const downloadsFolder = '/tmp'
      const uploadHandler = new UploadHandler({
        downloadsFolder,
        io: ioObj,
        socketId: '01'
      })

      const onData = jest.fn()
      jest.spyOn(fs, fs.createWriteStream.name)
        .mockImplementation(() => TestUtil.generateWritableStream(onData))

      
      const onTransform = jest.fn()
      jest.spyOn(uploadHandler, uploadHandler.handleFileBytes.name)
        .mockImplementationOnce(() => TestUtil.generateTransformStream(onTransform))

      const params = {
        fieldname: 'video',
        file: TestUtil.generateReadableStream(chunks),
        filename: 'mockfile.mov'
      }

      await uploadHandler.onFile(...Object.values(params))

      expect(onData.mock.calls.join()).toEqual(chunks.join())
      expect(onTransform.mock.calls.join()).toEqual(chunks.join())

      const expectedFilename = `${uploadHandler.downloadsFolder}/${params.filename}`
      expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFilename)
    })  
  })

  describe('handleFileBytes', () => {
    test('should call emit function and it is a transform stream', async () => {
      jest.spyOn(ioObj, ioObj.to.name)
      jest.spyOn(ioObj, ioObj.emit.name)

      const uploadHandler = new UploadHandler({
        io: ioObj,
        socketId: '01'        
      })

      const messages = ['hello']
      const source = TestUtil.generateReadableStream(messages)
      const onWrite = jest.fn()
      const target = TestUtil.generateWritableStream(onWrite)

      await pipeline(
        source,
        uploadHandler.handleFileBytes('file.txt'),
        target
      )

      expect(ioObj.to).toHaveBeenCalledTimes(messages.length)
      expect(ioObj.emit).toHaveBeenCalledTimes(messages.length)

      expect(onWrite).toHaveBeenCalledTimes(messages.length)
      expect(onWrite.mock.calls.join()).toEqual(messages.join())
    })
  })
})