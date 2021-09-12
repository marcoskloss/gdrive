export default class ConnectionManager {
  constructor({ apiUrl }) {
    this.apiUrl = apiUrl
  }

  async currentFiles() {
    const response = await fetch(this.apiUrl)
    return response.json()
  }
}