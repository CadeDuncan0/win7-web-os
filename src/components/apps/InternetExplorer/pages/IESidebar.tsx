'use client'

import portal from './IEPortal.module.css'
import { IE_TOP_PAGES } from '@/config/ieRoutes'

interface IESidebarProps {
  onNavigate: (nickname: string) => void
  /** Redirect entries hand off to a new browser tab (see InternetExplorerWindow). */
  onOpentab: (nickname: string) => void
}

/**
 * The boxed left rail shared by the portal pages. An "Explore" box lists every
 * top-level IE page as a classic hyperlink (in-app routing buttons, reusing the
 * `IE_TOP_PAGES` registry), followed by a period promo box. Because the links
 * come from the enabled registry, disabled routes never appear here.
 */
export function IESidebar({ onNavigate, onOpentab }: IESidebarProps) {
  return (
    <nav className={portal.sidebar} aria-label="Explore">
      <section className={portal.sideBox}>
        <div className={portal.sideBoxTitle}>Explore</div>
        <ul className={portal.sideList}>
          {IE_TOP_PAGES.map((page) => (
            <li key={page.nickname}>
              <button
                className={portal.sideLink}
                onClick={() => (page.redirect ? onOpentab : onNavigate)(page.nickname)}
                type="button"
              >
                {page.title}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={portal.sideBox}>
        <div className={portal.sideBoxTitle}>Did you know?</div>
        <p className={portal.sideText}>
          This whole desktop is an open, forkable template — clone it and swap in your own icons,
          pages, and apps.
        </p>
      </section>
    </nav>
  )
}
