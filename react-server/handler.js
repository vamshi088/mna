import server from '@mna/server'
import content from '@mna/content-server'
import createConfig from './config'
import render from './render'

const configBase = createConfig()

// Separate handler creation to support reload

export default async function createServerHandler(props) {

  const {
    App, routes,
    config: userConfig,
    content: contentInit = true,
    init: serverInit
  } = props

  const config = { ...configBase, ...userConfig }
  const routeProps = { config, server, content }
  const serverRoutes = [
    ...(contentInit ? await content.init(routeProps) : []),
    ...(await serverInit(routeProps) || [])
  ]

  const {
    serve, router,
    serveStatic,
    get, send, status, redirect
  } = server

  const serveFromAppRoot = serveStatic(config.cwd)

  const handler = serve(router([

    get('.well-known/*', serveFromAppRoot), // Let's Encrypt
    //get('robots.txt', serveFromAppRoot), // Let user put it in /static

    serveStatic(config.buildClient),

    ...serverRoutes,

    get(async (req, res) => {

      const location = req.url // From server/router
      const user = req.context.user // From content/user

      const { html, redirectLocation, statusCode } = await render({
        App,
        routes,
        assets: config.assets,
        location, status,
        content, user, req, res
      })

      if (html) {
        send(res, statusCode || status.ok, html)
      } else if (redirectLocation) {
        redirect(res, statusCode || status.redirect, redirectLocation)
      }
    }),

    (req, res) => send(res, status.notFound)
  ]))

  handler.config = config

  return handler
}
