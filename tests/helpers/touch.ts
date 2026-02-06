/**
 * Touch/TouchEvent helpers for jsdom, which lacks TouchEvent constructor.
 * Creates plain Events with `touches` and `changedTouches` patched on.
 */

interface FakeTouch {
  clientX: number;
  clientY: number;
  identifier: number;
}

function makeTouchList(...touches: FakeTouch[]): TouchList {
  const list = touches as unknown as TouchList;
  (list as any).length = touches.length;
  (list as any).item = (i: number) => touches[i] ?? null;
  return list;
}

export function createTouchEvent(
  type: string,
  touches: FakeTouch[],
  changedTouches?: FakeTouch[],
  options: { cancelable?: boolean } = {},
): Event {
  const e = new Event(type, {
    bubbles: true,
    cancelable: options.cancelable ?? true,
  });
  (e as any).touches = makeTouchList(...touches);
  (e as any).changedTouches = makeTouchList(...(changedTouches ?? touches));
  return e;
}

export function touch(x: number, y: number, id = 0): FakeTouch {
  return { clientX: x, clientY: y, identifier: id };
}
