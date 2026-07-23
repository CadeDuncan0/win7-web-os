import type { ComponentType } from 'react'

/** Props the WindowManager passes every application window component. */
export interface AppWindowProps {
  /** Redux window id — wires the OS chrome (geometry, focus, controls). */
  windowId: string
  /** IE-family apps only: nickname of the page to open on (the app's `ieRoute`). */
  initialRoute?: string
}

/**
 * The window identity an app module owns. Every app folder under
 * `src/components/apps/` renders its own Window and exports one of these,
 * declaring the `kind` its open windows group under (taskbar grouping,
 * per-kind size/position persistence) alongside the component that renders
 * them. Registry records in `config/applications.ts` reference a descriptor
 * instead of spelling out kind/component themselves, so a record can never
 * carry a mistyped kind or a mismatched component.
 */
export interface WindowApp {
  kind: string
  component: ComponentType<AppWindowProps>
}
