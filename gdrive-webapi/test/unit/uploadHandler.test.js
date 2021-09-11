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

      jest.spyOn(uploadHandler, uploadHandler.canExecute.name)
        .mockReturnValue(true)

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

    test('given messageTimeDelay as 2secs it should emit only two messages during 3 seconds period', async () => {
      jest.spyOn(ioObj, ioObj.emit.name)  
      const day = '2021-09-11 01:01'

      const twoSecondsDelay = 2000

      const onFirstLasMessageSent = TestUtil.getTimeFromDate(`${day}:01`)

      const onFirstCanExecute = TestUtil.getTimeFromDate(`${day}:03`)
      const onSecondUpdateLastMessageSent = onFirstCanExecute
      
      const onSecondCanExecute = TestUtil.getTimeFromDate(`${day}:04`)

      const onThirdCanExecute = TestUtil.getTimeFromDate(`${day}:05`)

      TestUtil.mockDateNow([
        onFirstLasMessageSent,
        onFirstCanExecute,
        onSecondUpdateLastMessageSent,
        onSecondCanExecute,
        onThirdCanExecute,
      ])

      const sourceData = ['hello', 'hello', 'world']
      const filename = 'file.txt'
      const source = TestUtil.generateReadableStream(sourceData)
      
      const uploadHandler = new UploadHandler({
        io: ioObj,
        socketId: '01',
        messageTimeDelay: twoSecondsDelay
      })
      
      await pipeline(
        source,
        uploadHandler.handleFileBytes(filename)
      )

      const expectedMessagesSent = 2
      expect(ioObj.emit).toHaveBeenCalledTimes(expectedMessagesSent)
      
      const [firstCallResult, secondCallResult] = ioObj.emit.mock.calls

      expect(firstCallResult).toEqual([
        uploadHandler.ON_UPLOAD_EVENT,
        { processedAlready: 'hello'.length, filename }
      ])

      expect(secondCallResult).toEqual([
        uploadHandler.ON_UPLOAD_EVENT,
        { processedAlready: sourceData.join('').length, filename }
      ])
    })
  })

  describe('canExecute', () => {
    const uploadHandler = new UploadHandler({
      io: {},
      socketId: ''
    })

    test('should return true when last execution is later than specified delay', () => {
      const timerDelay = 1000
      const uploadHandler = new UploadHandler({
        io: {},
        socketId: '',
        messageTimeDelay: timerDelay
      })
      
      const tickNow = TestUtil.getTimeFromDate('2021-07-01 00:00:03')
      TestUtil.mockDateNow([tickNow])

      const lastExecution = TestUtil.getTimeFromDate('2021-07-01 00:00:00')    

      const result = uploadHandler.canExecute(lastExecution)
      expect(result).toBeTruthy()
    })


    test('should return false when last execution isnt later than specified delay', () => {
      const timerDelay = 1000
      const uploadHandler = new UploadHandler({
        io: {},
        socketId: '',
        messageTimeDelay: timerDelay
      })
      
      const tickNow = TestUtil.getTimeFromDate('2021-07-01 00:00:00')
      TestUtil.mockDateNow([tickNow])

      const lastExecution = TestUtil.getTimeFromDate('2021-07-01 00:00:01')    

      const result = uploadHandler.canExecute(lastExecution)
      expect(result).toBeFalsy()
    })
  })
})