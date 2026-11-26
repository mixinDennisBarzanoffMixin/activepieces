import { createAction, Property } from '@activepieces/pieces-framework'
import { data } from './client'

export const etls = createAction({
  name: 'list_etls',
  displayName: 'List ETLs',
  description: 'List the ETLs visible to this Veritly project.',
  props: {},
  async run(context) {
    return await data.create(context.server).etls()
  },
})

export const listDatasets = createAction({
  name: 'list_datasets',
  displayName: 'List Tables',
  description: 'List the project tables visible to this Veritly project.',
  props: {},
  async run(context) {
    return await data.create(context.server).datasets()
  },
})

export const getJob = createAction({
  name: 'get_job',
  displayName: 'Get Data Job',
  description: 'Read the current canonical state and result of a Veritly Data job.',
  props: {
    job_id: Property.ShortText({ displayName: 'Job ID', required: true }),
  },
  async run(context) {
    const id = context.propsValue.job_id
    if (!id) throw new Error('Job ID is required')
    return await data.create(context.server).job(id)
  },
})
