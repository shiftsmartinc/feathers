import { generator, toFile } from '@feathershq/pinion'
import { renderSource } from '../../commons'
import { AppGeneratorContext } from '../index'

const template = ({}: AppGeneratorContext) => /* ts */ `/**
 * this file specifies schema and service defaults
 */

export const defaultReadonlyFields = [];

export const defaultServiceConfig = {};
`

export const generate = (ctx: AppGeneratorContext) =>
  generator(ctx).then(
    renderSource(
      template,
      toFile<AppGeneratorContext>(({ lib }) => lib, 'services', 'configs')
    )
  )
