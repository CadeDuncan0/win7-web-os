/** @dnd-kit sensor config for desktop icon dragging.
 *  The 5px activation distance prevents accidental drags on click.
 *
 *  Pointer-only by design: Windows 7 has no keyboard mechanism for
 *  repositioning desktop icons, so no KeyboardSensor is registered. */

import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core'

const ACTIVATION_DISTANCE_PX = 5

export function useDesktopSensors() {
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: ACTIVATION_DISTANCE_PX },
  })

  return useSensors(pointerSensor)
}
