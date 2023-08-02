import { generator, toFile } from '@feathershq/pinion'
import { renderSource } from '../../commons'
import { AppGeneratorContext } from '../index'

const template = ({}: AppGeneratorContext) => /* ts */ `/**
 * @external https://dove.feathersjs.com/guides/cli/application.html
 * @description For more information about this file see the link above.
 */#configure-functions
import type { Application } from '../declarations'

export const services = (app: Application) => {
  // #region Service Registration
  // These services will be registered with the application.
  // #endregion Service Registration
}
`

export const generate = (ctx: AppGeneratorContext) =>
  generator(ctx).then(
    renderSource(
      template,
      toFile<AppGeneratorContext>(({ lib }) => lib, 'services', 'index')
    )
  )
