export const PRINT_FONT_URL = '/fonts/Inter-Bold.ttf'

let request = null

// User calls this on the "3D Print" click, so the font loads at the same time as
// the dialog code. The dialog calls it again and gets the same request.
// After a failure, the next call fetches again.
export function loadPrintFont() {
  if (!request) {
    request = fetch(PRINT_FONT_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Font request failed: ${response.status}`)
        }
        return response.arrayBuffer()
      })
      .catch((err) => {
        request = null
        throw err
      })
  }
  return request
}
