import { KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'

const ACTIVATION_DISTANCE_PX = 5

export function useDesktopSensors() {
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: ACTIVATION_DISTANCE_PX },
  })
  const keyboardSensor = useSensor(KeyboardSensor)

  return useSensors(pointerSensor, keyboardSensor)
}
