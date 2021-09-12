export default class AppController {
  constructor({ connectionManager, viewManager, dragAndDropManager }) {
    this.connectionManager = connectionManager
    this.viewManager = viewManager
    this.dragAndDropManager = dragAndDropManager
    this.uploadingFiles = new Map()
  }

  async initialize() {
    this.viewManager.configureFileBtnClick()
    this.viewManager.configureOnFileChange(this.onFileChange.bind(this))
    this.viewManager.configureModal()

    this.dragAndDropManager.initialize({
      onDropHandler: this.onFileChange.bind(this)
    })
    
    this.connectionManager.configureEvents({
      onProgress: this.onProgress.bind(this)
    })
    
    this.viewManager.updateModalStatus(0)
    
    await this.updateCurrentFiles()
  }

  async onProgress({ processedAlready, filename }) {
    const file = this.uploadingFiles.get(filename)
    const processedSize = Math.ceil((100 * processedAlready) / file.size)
    this.updateProgress(file, processedSize)
  
    if (processedSize < 98) return

    return this.updateCurrentFiles()
  } 

  updateProgress(file, percent) {
    const uploadingFiles = this.uploadingFiles
    file.percent = percent

    const total = [...uploadingFiles.values()]
      .map(({ percent }) => percent ?? 0)
      . reduce((total, current) => total + current, 0)

    this.viewManager.updateModalStatus(total)
  }

  async onFileChange(files) {
    this.uploadingFiles.clear()
    
    const requests = []
    this.viewManager.openModal()
    this.viewManager.updateModalStatus(0)

    for (const file of files) {
      this.uploadingFiles.set(file.name, file)
      requests.push(this.connectionManager.uploadFile(file))
    }

    await Promise.all(requests)
    this.viewManager.updateModalStatus(100)

    setTimeout(() => {
      this.viewManager.closeModal()
    }, 1000)
    await this.updateCurrentFiles()
  }


  async updateCurrentFiles() {
    const files = await this.connectionManager.currentFiles()
    this.viewManager.updateCurrentFiles(files)
  }
}