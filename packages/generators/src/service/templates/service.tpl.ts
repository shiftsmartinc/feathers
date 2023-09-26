import { generator, toFile, before } from '@feathershq/pinion'
import { fileExists, injectSource, renderSource } from '../../commons'
import { ServiceGeneratorContext } from '../index'

export const template = ({
  camelName,
  authentication,
  isEntityService,
  path,
  lib,
  language,
  className,
  relative,
  schema,
  fileName,
  type
}: ServiceGeneratorContext) => /* ts */ `/**
 * @external https://feathersjs.com/guides/cli/service.html
 * @description For more information about this file see the link above.
 */
import type { Application } from '${relative}/declarations'

${authentication || isEntityService ? `import { authenticate } from '@feathersjs/authentication'` : ''}
${
  schema
    ? `
import { hooks as schemaHooks } from '@feathersjs/schema'
    
import {
  ${camelName}DataValidator,
  ${camelName}PatchValidator,
  ${camelName}QueryValidator,
  ${camelName}Resolver,
  ${camelName}ExternalResolver,
  ${camelName}DataResolver,
  ${camelName}PatchResolver,
  ${camelName}QueryResolver
} from './${fileName}.schema'
`
    : ''
}

import { ${className}, getOptions } from './${fileName}.class'
${
  fileExists(lib, `client.${language}`)
    ? `import { ${camelName}Path, ${camelName}Methods } from './${fileName}.shared'`
    : `
export const ${camelName}Path = '${path}'
export const ${camelName}Methods = ['find', 'get', 'create', 'patch', 'remove'] as const`
}

/** TODO: Confirm these are not required [PDF 2023-07-28] */
// export * from './${fileName}.class'
// ${schema ? `export * from './${fileName}.schema'` : ''}

/** 
 * @description A configure function that registers the service and its hooks via \`app.configure\` 
 */
export const ${camelName} = (app: Application) => {
  /** Register our service on the Feathers application */
  app.use(${camelName}Path, new ${className}(getOptions(app)), {
    /** A list of all methods this service exposes externally */
    methods: ${camelName}Methods,
    /** You can add additional custom events to be sent to clients here */
    events: []
  })
  /** Initialize hooks */
  ${
    type === 'mongodb'
      ? `// @ts-expect-error [ENG-770] FIXME: Types of property 'update' are incompatible: NullableId vs AdapterId`
      : ''
  }
  app.service(${camelName}Path).hooks({
    around: {
      all: [${
        authentication
          ? `
        authenticate('jwt'),`
          : ''
      } ${
        schema
          ? `
        schemaHooks.resolveExternal(${camelName}ExternalResolver),
        schemaHooks.resolveResult(${camelName}Resolver),`
          : ''
      }
      ],${
        isEntityService
          ? `
      find: [authenticate('jwt')],
      get: [authenticate('jwt')],
      create: [],
      update: [authenticate('jwt')],
      patch: [authenticate('jwt')],
      remove: [authenticate('jwt')]`
          : ''
      }
    },
    before: {
      all: [${
        schema
          ? `
        schemaHooks.validateQuery(${camelName}QueryValidator),
        schemaHooks.resolveQuery(${camelName}QueryResolver)
      `
          : ''
      }],
      find: [],
      get: [],
      create: [${
        schema
          ? `
        schemaHooks.validateData(${camelName}DataValidator),
        schemaHooks.resolveData(${camelName}DataResolver)
      `
          : ''
      }],
      patch: [${
        schema
          ? `
        schemaHooks.validateData(${camelName}PatchValidator),
        schemaHooks.resolveData(${camelName}PatchResolver)
      `
          : ''
      }],
      remove: []
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}

/** 
 * @description Adds this service to the service type index 
 */
declare module '${relative}/declarations' {
  interface ServiceTypes {
    [${camelName}Path]: ${className}
  }
}
`

const toServiceIndex = toFile(({ lib }: ServiceGeneratorContext) => [lib, 'services', `index`])

export const generate = (ctx: ServiceGeneratorContext) =>
  generator(ctx)
    .then(
      renderSource(
        template,
        toFile(({ lib, fileName, folder }: ServiceGeneratorContext) => [
          lib,
          'services',
          ...folder,
          `${fileName}`
        ])
      )
    )
    .then(
      injectSource<ServiceGeneratorContext>(
        ({ camelName, folder, fileName }) =>
          `import { ${camelName} } from './${folder.join('/')}/${fileName}'`,
        before('// #endregion Service Imports'),
        toServiceIndex
      )
    )
    .then(
      injectSource<ServiceGeneratorContext>(
        ({ camelName }) => `  app.configure(${camelName})`,
        before('// #endregion Service Registration'),
        toServiceIndex
      )
    )
