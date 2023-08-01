import { generator, toFile } from '@feathershq/pinion'
import { renderSource } from '../../commons'
import { ServiceGeneratorContext } from '../index'

const template = ({
  relative,
  lib,
  path
}: ServiceGeneratorContext) => /* ts */ `/**
* @external https://dove.feathersjs.com/guides/cli/service.test.html
* @description For more information about this file see the link above.
*/
import assert from 'assert'
import { app } from '../${relative}/${lib}/app'

describe('${path} service', () => {
  it('registered the service', () => {
    const service = app.service('${path}')

    assert.ok(service, 'Registered the service')
  })
})
`

export const generate = (ctx: ServiceGeneratorContext) =>
  generator(ctx).then(
    renderSource(
      template,
      toFile<ServiceGeneratorContext>(({ test, folder, fileName }) => [
        test,
        'services',
        ...folder,
        `${fileName}.test`
      ])
    )
  )
