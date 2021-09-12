export default class DragAndDropManager {
  constructor() {
    this.dropArea = document.getElementById('dropArea')
    this.onDropHandler = () => {}
  }

  initialize({ onDropHandler }) {
    this.onDropHandler = onDropHandler
    this.disableDragAndDropEvents()
    this.enableHighlightOnDrag()
    this.enableDrop()
  }

  disableDragAndDropEvents() {
    const events = [
      'dragenter',
      'dragover',
      'dragleave',
      'drop'
    ]

    const preventDefaults = (e) => {
      e.preventDefault()
      e.stopPropagation()
    }

    events.forEach(event => {
      this.dropArea.addEventListener(event, preventDefaults, false)
      document.body.addEventListener(event, preventDefaults, false)
    })
  }

  enableHighlightOnDrag() {
    const events = ['dragenter', 'dragover']
    const highlight = (e) => {
      this.dropArea.classList.add('highlight')
      this.dropArea.classList.add('drop-area')
    }

    events.forEach(event => {
      this.dropArea.addEventListener(event, highlight, false)
    })
  }

  enableDrop(e) {
    const drop = (e) => {
      this.dropArea.classList.remove('drop-area')

      const files = e.dataTransfer.files
      return this.onDropHandler(files)
    }

    this.dropArea.addEventListener('drop', drop, false)
  }
}