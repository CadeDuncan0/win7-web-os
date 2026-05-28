const DIR = '/imgs/windows7/user-icons'

const FILES = [
  'guest.bmp',
  'user.bmp',
  'usertile10.bmp',
  'usertile11.bmp',
  'usertile12.bmp',
  'usertile13.bmp',
  'usertile14.bmp',
  'usertile15.bmp',
  'usertile16.bmp',
  'usertile17.bmp',
  'usertile18.bmp',
  'usertile19.bmp',
  'usertile20.bmp',
  'usertile21.bmp',
  'usertile22.bmp',
  'usertile23.bmp',
  'usertile24.bmp',
  'usertile25.bmp',
  'usertile26.bmp',
  'usertile27.bmp',
  'usertile28.bmp',
  'usertile29.bmp',
  'usertile30.bmp',
  'usertile31.bmp',
  'usertile32.bmp',
  'usertile33.bmp',
  'usertile34.bmp',
  'usertile35.bmp',
  'usertile36.bmp',
  'usertile37.bmp',
  'usertile38.bmp',
  'usertile39.bmp',
  'usertile40.bmp',
  'usertile41.bmp',
  'usertile42.bmp',
  'usertile43.bmp',
  'usertile44.bmp',
] as const

export const USER_ICONS: readonly string[] = FILES.map((f) => `${DIR}/${f}`)

function randomIndex(): number {
  return Math.floor(Math.random() * USER_ICONS.length)
}

export function pickTwoDistinctIcons(): readonly [string, string] {
  const first = USER_ICONS[randomIndex()]
  let second = USER_ICONS[randomIndex()]
  while (second === first) {
    second = USER_ICONS[randomIndex()]
  }
  return [first, second] as const
}
