import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Vunachain_CMS',

  projectId: '7iqshxb6',
  dataset: process.env.SANITY_DATASET || 'development',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },

  // CORS configuration for API access
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3333',
    ],
    credentials: true,
  },
})
