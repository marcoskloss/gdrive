export class ViewManager {
  constructor() {
    this.tbody = document.getElementById('tbody')
    this.newFileBtn = document.getElementById('newFileBtn')
    this.fileInputElement = document.getElementById('fileElem')
    this.formatter = new Intl.DateTimeFormat('pt', {
      local: 'pt-br',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    this.progressModal = document.getElementById('progressModal')
    this.progressBar = document.getElementById('progressBar')
    this.output = document.getElementById('output')
    this.modalInstance = {}
  }

  configureModal() {
    this.modalInstance = M.Modal.init(this.progressModal, {
      opacity: 0,
      dismissable: false,
      onOpenEnd() {
        this.$overlay[0].remove()
      }
    })
  }

  openModal() {
    this.modalInstance.open()
  }
  
  closeModal() {
    this.modalInstance.close()
  }

  updateModalStatus(size) {
    this.output.innerHTML = `Uploading in <strong>${Math.floor(size)}%</strong>`
    this.progressBar.value = size
  }
  
  configureOnFileChange(fn) {
    this.fileInputElement.onchange = (e) => fn(e.target.files)
  }
  
  configureFileBtnClick() {
    this.newFileBtn.onclick = () => this.fileInputElement.click()
  }

  getIcon(file) {
    return file.match(/\.mp4/i) ? 'movie' 
      : file.match(/\.jp|png/) ? 'image'
        : 'content_copy'
  }
  
  makeIcon(file) {
    const icon = this.getIcon(file)
    const colors = {
      image: 'yellow600',
      movie: 'red600',
      file: '',
      content_copy: '',
    }
    
    return `
      <i class="material-icons ${colors[icon]} left">${icon}</i>
    `
  }
  
  updateCurrentFiles(files) {
    const template = (item) => `
    <tr>
      <td>${this.makeIcon(item.file)} ${item.file}</td>
      <td>${item.owner}</td>
      <td>${this.formatter.format(new Date(item.lastModified))}</td>
      <td>${item.size}</td>
    </tr>
    `
    const html = files.map(template).join('')
    this.tbody.innerHTML = html
  }
}