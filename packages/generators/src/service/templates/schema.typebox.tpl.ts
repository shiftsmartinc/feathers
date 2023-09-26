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

import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '${relative}/declarations'

import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
${localTemplate(authStrategies, `import { passwordHash } from '@feathersjs/authentication-local'`)}

import { dataValidator, queryValidator } from '${relative}/${
  fileExists(cwd, lib, 'schemas') ? 'schemas/' : '' /** This is for legacy backwards compatibility */
}validators'

${type === 'custom' ? '' : `import { defaultReadonlyFields } from '../configs'`}
import { ${singularCamelName} as ${camelName}Schema } from './${fileName}.schema.gen'
export { ${camelName}Schema };
export type ${singularUpperName} = Static<typeof ${camelName}Schema>

export const ${camelName}Validator = getValidator(${camelName}Schema, dataValidator)
export const ${camelName}Resolver = resolve<${singularUpperName}, HookContext>({})

export const ${camelName}ExternalResolver = resolve<${singularUpperName}, HookContext>({
  ${localTemplate(
    authStrategies,
    `/** The password should never be visible externally */
  password: async () => undefined`
  )}  
})

const ${camelName}ReadonlyFields: (keyof ${singularUpperName})[] = ${
  type === 'custom' ? '[]' : '[...defaultReadonlyFields]'
}

/** 
 * @title: ${camelName}DataSchema
 * @description Schema for creating new entries 
 */

export const ${camelName}DataSchema =  ${isEntityService ? `Type.Pick` : `Type.Omit`}(${camelName}Schema, [
  ${
    isEntityService
      ? authStrategies.map((name) => (name === 'local' ? `'email', 'password'` : `'${name}Id'`)).join(', ')
      : `...(${camelName}ReadonlyFields),`
  }
], {
  $id: '${upperName}Data'
})
// FIXME: this type is '{}' because the readonlyFields have as type all the keys of the schema
export type ${upperName}Data = Static<typeof ${camelName}DataSchema>
export const ${camelName}DataValidator = getValidator(${camelName}DataSchema, dataValidator)
export const ${camelName}DataResolver = resolve<${singularUpperName}, HookContext>({
  ${localTemplate(authStrategies, `password: passwordHash({ strategy: 'local' })`)}
})

/** 
 * @title: ${camelName}PatchSchema
 * @description Schema for updating existing entries 
 */
export const ${camelName}PatchSchema = Type.Partial(
  Type.Omit(${camelName}Schema, ${camelName}ReadonlyFields), 
  {
    $id: '${upperName}Patch'
  },
)
export type ${upperName}Patch = Static<typeof ${camelName}PatchSchema>
export const ${camelName}PatchValidator = getValidator(${camelName}PatchSchema, dataValidator)
export const ${camelName}PatchResolver = resolve<${singularUpperName}, HookContext>({
  ${localTemplate(authStrategies, `password: passwordHash({ strategy: 'local' })`)}
})

/** 
 * @title: ${camelName}QueryProperties
 * @description Schema for allowed query properties 
 */
export const ${camelName}QueryProperties = Type.Omit(${camelName}Schema, ${
  type === 'mongodb' ? `['_id']` : '[]'
}) ${
  isEntityService
    ? `& Type.Pick(${camelName}Schema, [
  ${authStrategies.map((name) => (name === 'local' ? `'email'` : `'${name}Id'`)).join(', ')}
])`
    : ''
}
export const ${camelName}QuerySchema = Type.Intersect([
  querySyntax(${camelName}QueryProperties),
  /** Add additional query properties here */
  Type.Object({}, { additionalProperties: false })
], { additionalProperties: false })
export type ${upperName}Query = Static<typeof ${camelName}QuerySchema>
export const ${camelName}QueryValidator = getValidator(${camelName}QuerySchema, queryValidator)
export const ${camelName}QueryResolver = resolve<${upperName}Query, HookContext>({
  ${
    isEntityService
      ? `
  /** If there is a user (e.g. with authentication), they are only allowed to see their own data */
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
      ({ schema }) => schema === 'typebox',
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
