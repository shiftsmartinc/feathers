import { generator, toFile, when } from '@feathershq/pinion'
import { fileExists, localTemplate, renderSource } from '../../commons'
import { ServiceGeneratorContext } from '../index'

const template = ({
  camelName,
  upperName,
  singularCamelName,
  singularUpperName,
  fileName,
  relative,
  authStrategies,
  isEntityService,
  type,
  cwd,
  lib
}: ServiceGeneratorContext) => /* ts */ `/**
 * @external https://feathersjs.com/guides/cli/service.schemas.html
 * @description For more information about this file see the link above.
 */

import { resolve, getValidator, querySyntax } from '@feathersjs/schema'${
  type === 'mongodb'
    ? `
import { ObjectIdSchema } from '@feathersjs/schema'`
    : ''
}
import type { FromSchema } from '@feathersjs/schema'
${localTemplate(authStrategies, `import { passwordHash } from '@feathersjs/authentication-local'`)}

import type { HookContext } from '${relative}/declarations'
import { dataValidator, queryValidator } from '${relative}/${
  fileExists(cwd, lib, 'schemas') ? 'schemas/' : '' // This is for legacy backwards compatibility
}validators'

// Main data model schema

import { ${singularCamelName} as ${camelName}Schema } from './${fileName}.schema.gen'
export { ${camelName}Schema };
export type ${singularUpperName} = FromSchema<typeof ${camelName}Schema>

export const ${camelName}Validator = getValidator(${camelName}Schema, dataValidator)
export const ${camelName}Resolver = resolve<${singularUpperName}, HookContext>({})

export const ${camelName}ExternalResolver = resolve<${singularUpperName}, HookContext>({
  ${localTemplate(
    authStrategies,
    `// The password should never be visible externally
  password: async () => undefined`
  )}
})

// Schema for creating new data
export const ${camelName}DataSchema = {
  $id: '${upperName}Data',
  type: 'object',
  additionalProperties: false,
  required: [ ${localTemplate(authStrategies, `'email'`, `'text'`)} ],
  properties: {
    ...${camelName}Schema.properties
  }
} as const
export type ${upperName}Data = FromSchema<typeof ${camelName}DataSchema>
export const ${camelName}DataValidator = getValidator(${camelName}DataSchema, dataValidator)
export const ${camelName}DataResolver = resolve<${upperName}Data, HookContext>({
  ${localTemplate(authStrategies, `password: passwordHash({ strategy: 'local' })`)}
})

// Schema for updating existing data
export const ${camelName}PatchSchema = {
  $id: '${upperName}Patch',
  type: 'object',
  additionalProperties: false,
  required: [],
  properties: {
    ...${camelName}Schema.properties
  }
} as const
export type ${upperName}Patch = FromSchema<typeof ${camelName}PatchSchema>
export const ${camelName}PatchValidator = getValidator(${camelName}PatchSchema, dataValidator)
export const ${camelName}PatchResolver = resolve<${upperName}Patch, HookContext>({
  ${localTemplate(authStrategies, `password: passwordHash({ strategy: 'local' })`)}
})

// Schema for allowed query properties
export const ${camelName}QuerySchema = {
  $id: '${upperName}Query',
  type: 'object',
  additionalProperties: false,
  properties: {
    ...querySyntax(${camelName}Schema.properties)
  }
} as const
export type ${upperName}Query = FromSchema<typeof ${camelName}QuerySchema>
export const ${camelName}QueryValidator = getValidator(${camelName}QuerySchema, queryValidator)
export const ${camelName}QueryResolver = resolve<${upperName}Query, HookContext>({
  ${
    isEntityService
      ? `
  // If there is a user (e.g. with authentication), they are only allowed to see their own data
  ${type === 'mongodb' ? '_id' : 'id'}: async (value, user, context) => {
    if (context.params.user) {
      return context.params.user.${type === 'mongodb' ? '_id' : 'id'}
    }

    return value
  }`
      : ''
  }
})
`

export const generate = (ctx: ServiceGeneratorContext) =>
  generator(ctx).then(
    when<ServiceGeneratorContext>(
      ({ schema }) => schema === 'json',
      renderSource(
        template,
        toFile(({ lib, folder, fileName }: ServiceGeneratorContext) => [
          lib,
          'services',
          ...folder,
          `${fileName}.schema`
        ])
      )
    )
  )
