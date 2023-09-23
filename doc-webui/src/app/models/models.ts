export interface DeckInfo {
  id: string
  name: string
  description: string
}

export interface DeckStatus {
  deck_id: string
  remaining: number
  shuffled: boolean
  success: boolean
}

export interface DeckBackImage {
  back_image: string
}
