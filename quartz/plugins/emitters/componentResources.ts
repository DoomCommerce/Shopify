import { FilePath, FullSlug, joinSegments } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"

// @ts-ignore
import spaRouterScript from "../../components/scripts/spa.inline"
// @ts-ignore
import popoverScript from "../../components/scripts/popover.inline"
import styles from "../../styles/custom.scss"
import popoverStyle from "../../components/styles/popover.scss"
import { BuildCtx } from "../../util/ctx"
import { QuartzComponent } from "../../components/types"
import { googleFontHref, joinStyles } from "../../util/theme"
import { Features, transform } from "lightningcss"
import { transform as transpile } from "esbuild"
import { write } from "./helpers"
import DepGraph from "../../depgraph"

type ComponentResources = {
  css: string[]
  beforeDOMLoaded: string[]
  afterDOMLoaded: string[]
}

function getComponentResources(ctx: BuildCtx): ComponentResources {
  const allComponents: Set<QuartzComponent> = new Set()
  for (const emitter of ctx.cfg.plugins.emitters) {
    const components = emitter.getQuartzComponents(ctx)
    for (const component of components) {
      allComponents.add(component)
    }
  }

  const componentResources = {
    css: new Set<string>(),
    beforeDOMLoaded: new Set<string>(),
    afterDOMLoaded: new Set<string>(),
  }

  for (const component of allComponents) {
    const { css, beforeDOMLoaded, afterDOMLoaded } = component
    if (css) {
      componentResources.css.add(css)
    }
    if (beforeDOMLoaded) {
      componentResources.beforeDOMLoaded.add(beforeDOMLoaded)
    }
    if (afterDOMLoaded) {
      componentResources.afterDOMLoaded.add(afterDOMLoaded)
    }
  }

  return {
    css: [...componentResources.css],
    beforeDOMLoaded: [...componentResources.beforeDOMLoaded],
    afterDOMLoaded: [...componentResources.afterDOMLoaded],
  }
}

async function joinScripts(scripts: string[]): Promise<string> {
  // wrap with iife to prevent scope collision
  const script = scripts.map((script) => `(function () {${script}})();`).join("\n")

  // minify with esbuild
  const res = await transpile(script, {
    minify: true,
  })

  return res.code
}

function addGlobalPageResources(ctx: BuildCtx, componentResources: ComponentResources) {
  const cfg = ctx.cfg.configuration

  // popovers
  if (cfg.enablePopovers) {
    componentResources.afterDOMLoaded.push(popoverScript)
    componentResources.css.push(popoverStyle)
  }



  if (cfg.enableSPA) {
    componentResources.afterDOMLoaded.push(spaRouterScript)
  } else {
    componentResources.afterDOMLoaded.push(`
      window.spaNavigate = (url, _) => window.location.assign(url)
      window.addCleanup = () => {}
      const event = new CustomEvent("nav", { detail: { url: document.body.dataset.slug } })
      document.dispatchEvent(event)
    `)
  }
}

// This emitter should not update the `resources` parameter. If it does, partial
// rebuilds may not work as expected.
export const ComponentResources: QuartzEmitterPlugin = () => {
  return {
    name: "ComponentResources",
    getQuartzComponents() {
      return []
    },
    async getDependencyGraph(_ctx, _content, _resources) {
      return new DepGraph<FilePath>()
    },
    async emit(ctx, _content, _resources): Promise<FilePath[]> {
      const promises: Promise<FilePath>[] = []
      const cfg = ctx.cfg.configuration
      // component specific scripts and styles
      const componentResources = getComponentResources(ctx)
      let googleFontsStyleSheet = ""
      if (cfg.theme.fontOrigin === "local") {
        // let the user do it themselves in css
      } else if (cfg.theme.fontOrigin === "googleFonts" && !cfg.theme.cdnCaching) {
        // when cdnCaching is true, we link to google fonts in Head.tsx
        let match

        const fontSourceRegex = /url\((https:\/\/fonts.gstatic.com\/s\/[^)]+\.(woff2|ttf))\)/g

        googleFontsStyleSheet = await (
          await fetch(googleFontHref(ctx.cfg.configuration.theme))
        ).text()

        while ((match = fontSourceRegex.exec(googleFontsStyleSheet)) !== null) {
          // match[0] is the `url(path)`, match[1] is the `path`
          const url = match[1]
          // the static name of this file.
          const [filename, ext] = url.split("/").pop()!.split(".")

          googleFontsStyleSheet = googleFontsStyleSheet.replace(
            url,
            `https://${cfg.baseUrl}/static/fonts/${filename}.ttf`,
          )

          promises.push(
            fetch(url)
              .then((res) => {
                if (!res.ok) {
                  throw new Error(`Failed to fetch font`)
                }
                return res.arrayBuffer()
              })
              .then((buf) =>
                write({
                  ctx,
                  slug: joinSegments("static", "fonts", filename) as FullSlug,
                  ext: `.${ext}`,
                  content: Buffer.from(buf),
                }),
              ),
          )
        }
      }

      // important that this goes *after* component scripts
      // as the "nav" event gets triggered here and we should make sure
      // that everyone else had the chance to register a listener for it
      addGlobalPageResources(ctx, componentResources)

      const stylesheet = joinStyles(
        ctx.cfg.configuration.theme,
        googleFontsStyleSheet,
        ...componentResources.css,
        styles,
      )
      const [prescript, postscript] = await Promise.all([
        joinScripts(componentResources.beforeDOMLoaded),
        joinScripts(componentResources.afterDOMLoaded),
      ])

      promises.push(
        write({
          ctx,
          slug: "index" as FullSlug,
          ext: ".css",
          content: transform({
            filename: "index.css",
            code: Buffer.from(stylesheet),
            minify: true,
            targets: {
              safari: (15 << 16) | (6 << 8), // 15.6
              ios_saf: (15 << 16) | (6 << 8), // 15.6
              edge: 115 << 16,
              firefox: 102 << 16,
              chrome: 109 << 16,
            },
            include: Features.MediaQueries,
          }).code.toString(),
        }),
        write({
          ctx,
          slug: "prescript" as FullSlug,
          ext: ".js",
          content: prescript,
        }),
        write({
          ctx,
          slug: "postscript" as FullSlug,
          ext: ".js",
          content: postscript,
        }),
      )

      return await Promise.all(promises)
    },
  }
}
