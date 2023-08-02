import { generator, toFile, after, before, when } from '@feathershq/pinion'
import { fileExists, injectSource } from '../../commons'
import { ServiceGeneratorContext } from '../index'

const importTemplate = ({ folder, fileName, camelName }: ServiceGeneratorContext) => /* ts */ `
import { ${camelName}Client } from './services/${folder.join('/')}/${fileName}.shared'
`

const typeExportTemplate = ({
  upperName,
  singluarUpperName,
  folder,
  fileName
}: ServiceGeneratorContext) => /* ts */ `
export type {
  ${singluarUpperName},
  ${upperName}Data,
  ${upperName}Query,
  ${upperName}Patch
} from './services/${folder.join('/')}/${fileName}.shared'
`

const registrationTemplate = ({ camelName }: ServiceGeneratorContext) =>
  `  client.configure(${camelName}Client)`

const toClientFile = toFile<ServiceGeneratorContext>(({ lib }) => [lib, 'client'])

export const generate = async (ctx: ServiceGeneratorContext) =>
  generator(ctx).then(
    when<ServiceGeneratorContext>(
      ({ lib, language }) => fileExists(lib, `client.${language}`),
      injectSource(registrationTemplate, before('return client'), toClientFile),
      injectSource(
        importTemplate,
        before<ServiceGeneratorContext>(({ language }) => language === '// #endregion Service Type Imports'),
        toClientFile
      ),
      injectSource(
        typeExportTemplate,
        before<ServiceGeneratorContext>(({ language }) => language === '// #endregion Service Type Imports'),
        toClientFile
      )
    )
  )
