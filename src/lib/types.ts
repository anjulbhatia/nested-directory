export interface Startup {
  id: string
  name: string
  one_liner: string
  long_description?: string
  batch: string
  tags: string[]
  industries: string[]
  website?: string
  small_logo_thumb_url?: string
  ycUrl?: string
  url?: string
  slug: string
  team_size?: number
  location?: string
  all_locations?: string
  status?: string
  year_founded?: number
  founders?: Founder[]
}

export interface Founder {
  name: string
  title?: string
  avatar_url?: string
  linkedin_url?: string
  twitter_url?: string
}

export interface Collection {
  id: string
  name: string
  color?: string
  description?: string
  startupIds: string[]
}

export interface Note {
  id: string
  startupId: string
  content: string
  createdAt: number
  updatedAt: number
}

export interface StartupUserTag {
  id: string
  startupId: string
  label: string
  color?: string
}
