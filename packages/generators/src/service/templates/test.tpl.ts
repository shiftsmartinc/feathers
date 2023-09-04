import { generator, toFile } from '@feathershq/pinion'
import { renderSource } from '../../commons'
import { ServiceGeneratorContext } from '../index'

const template = ({ relative, lib, path }: ServiceGeneratorContext) => /* ts */ `/**
 * @external https://feathersjs.com/guides/cli/service.test.html
 * @description For more information about this file see the link above.
 */

import { describe, expect, test } from 'vitest';
import { app } from '../${relative}/${lib}/app'

describe('${path} service', () => {
  test('registered the service', () => {
    const service = app.service('${path}');

    expect(service, 'Registered the service').toBeTruthy();
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
