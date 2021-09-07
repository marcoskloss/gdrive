import {
  describe,
  test,
  expect,
  jest
} from '@jest/globals'
import fs from 'fs'
import FileHelper from '../../src/fileHelper.js'

describe('FileHelper', () => {
  describe('GetFileStatus', () => {
    test('it should return files statuses in correct format', async () => {
      const statMock = {
        dev: 2054,
        mode: 33204,
        nlink: 1,
        uid: 1000,
        gid: 1000,
        rdev: 0,
        blksize: 4096,
        ino: 7886027,
        size: 644950,
        blocks: 1264,
        atimeMs: 1631025144411.0317,
        mtimeMs: 1631025144034.9575,
        ctimeMs: 1631025144046.96,
        birthtimeMs: 1631025144030.9568,
        atime: '2021-09-07T14:32:24.411Z',
        mtime: '2021-09-07T14:32:24.035Z',
        ctime: '2021-09-07T14:32:24.047Z',
        birthtime: '2021-09-07T14:32:24.031Z'
      }
      
      const mockUser = 'marcoskloss'
      process.env.USER = mockUser
      const fileName = 'file.jpg'

      jest
        .spyOn(fs.promises, fs.promises.readdir.name)
        .mockResolvedValue([fileName])

      jest
        .spyOn(fs.promises, fs.promises.stat.name)
        .mockResolvedValue(statMock)
      
      const result = await FileHelper.getFilesStatus('/tmp')
        
      const expectedResult = [
        {
          size: '645 kB',
          lastModified: statMock.birthtime,
          owner: 'marcoskloss',
          file: fileName
        }
      ]
      
      expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${fileName}`)
      expect(result).toMatchObject(expectedResult)
    })
  })
})

