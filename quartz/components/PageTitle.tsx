import { pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"

const PageTitle: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const title = cfg.htmlTitle ?? cfg?.pageTitle ?? i18n(cfg.locale).propertyDefaults.title
  const baseDir = pathToRoot(fileData.slug!)
  return (
    <h2 class={classNames(displayClass, "page-title")}>
        <img width={64} src='/Images/Logo.webp' />
      <a href={baseDir} dangerouslySetInnerHTML={{ __html : title }} />
    </h2>
  )
}

PageTitle.css = `
.page-title {
  font-size: 1.75rem;
  margin: 0;
      display: flex;
    gap: 0.5rem;
    position: relative;
    align-items: center;
}

.page-title img {
    height: 4rem;
    width: auto;
    min-width: 0;
    min-height: 0;
    display: block;
    object-fit: contain;
    object-position: center;
}
`

export default (() => PageTitle) satisfies QuartzComponentConstructor
