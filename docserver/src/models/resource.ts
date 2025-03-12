export interface Metadata {
  id: string
  name: string
  description?: string
}

export interface Resource {
  _id?: string
  apiVersion: string
  kind: string
  metadata: Metadata
}
