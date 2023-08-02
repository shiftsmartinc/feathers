import { generator, toFile, when } from '@feathershq/pinion'
import { renderSource } from '../../commons'
import { AppGeneratorContext } from '../index'

const template = ({ name, language }: AppGeneratorContext) => /* ts */ `/**
 * @external https://dove.feathersjs.com/guides/cli/client.html
 * @description For more information about this file see the link above.
 */

import type { TransportConnection, Application } from '@feathersjs/feathers'
import type { AuthenticationClientOptions } from '@feathersjs/authentication-client'

import { feathers } from '@feathersjs/feathers'
import authenticationClient from '@feathersjs/authentication-client'

// #region Service Type Imports: These services will be made available within the client.
// #endregion Service Type Imports

// #region Service Type Exports: These are used to type the generated client.
// #endregion Service Type Exports

export interface Configuration {
  connection: TransportConnection<ServiceTypes>
}

export interface ServiceTypes {}

export type ClientApplication = Application<ServiceTypes, Configuration>

/**
 * Returns a ${language === 'ts' ? 'typed' : ''} client for the ${name} app.
 * 
 * @param connection The REST or Socket.io Feathers client connection
 * @param authenticationOptions Additional settings for the authentication client
 * @see https://dove.feathersjs.com/api/client.html
 * @returns The Feathers client application
 */
export const createClient = <Configuration = any> (
  connection: TransportConnection<ServiceTypes>,
  authenticationOptions: Partial<AuthenticationClientOptions> = {}
) => {
  const client: ClientApplication = feathers()

  client.configure(connection)
  client.configure(authenticationClient(authenticationOptions))
  client.set('connection', connection)

  return client
}
`

export const generate = async (ctx: AppGeneratorContext) =>
  generator(ctx).then(
    when<AppGeneratorContext>(
      (ctx) => ctx.client,
      renderSource(
        template,
        toFile<AppGeneratorContext>(({ lib }) => lib, 'client')
      )
    )
  )
