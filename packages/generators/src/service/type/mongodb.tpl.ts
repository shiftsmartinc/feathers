import { generator, toFile } from '@feathershq/pinion'
import { renderSource } from '../../commons'
import { ServiceGeneratorContext } from '../index'

export const template = ({
  className,
  upperName,
  singularUpperName,
  schema,
  fileName,
  kebabPath,
  relative
}: ServiceGeneratorContext) => /* ts */ `/**
 * @external https://feathersjs.com/guides/cli/service.class.html#database-services
 * @description For more information about this file see the link above.
 */

import type { Params } from '@feathersjs/feathers'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from \'@feathersjs/mongodb\'
import type { Application } from '${relative}/declarations'
${
  schema
    ? `import type {
  ${singularUpperName},
  ${upperName}Data,
  ${upperName}Patch,
  ${upperName}Query
} from './${fileName}.schema'
`
    : `
type ${upperName} = any
type ${upperName}Data = any
type ${upperName}Patch = any
type ${upperName}Query = any
`
}

import { MongoDBService } from \'@feathersjs/mongodb\'

export type { ${singularUpperName}, ${upperName}Data, ${upperName}Patch, ${upperName}Query }

export interface ${upperName}Params extends MongoDBAdapterParams<${upperName}Query> {
}

/**
 * By default calls the standard MongoDB adapter service methods but can be
 * customized with your own functionality.
 */
export class ${className}<ServiceParams extends Params = ${upperName}Params>
  extends MongoDBService<${singularUpperName}, ${upperName}Data, ServiceParams, ${upperName}Patch> {
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    id: 'uuid',
    Model: app.get('mongodbClient').then(db => db.collection('${kebabPath}')),
    paginate: app.get('paginate'),
  }
}
`

export const generate = (ctx: ServiceGeneratorContext) =>
  generator(ctx).then(
    renderSource(
      template,
      toFile<ServiceGeneratorContext>(({ lib, folder, fileName }) => [
        lib,
        'services',
        ...folder,
        `${fileName}.class`
      ])
    )
  )
