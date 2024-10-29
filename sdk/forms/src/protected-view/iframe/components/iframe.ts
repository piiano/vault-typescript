import { sendSizeEvents } from '../../../common/size';
import type { Sender } from '../../../common/events';
import { View } from './view';
import { component } from '../../../common/component';
import { Result } from '../index';
import { DisplayOptions } from '../../../common/models';

export function renderView(sendToParent: Sender, result: Result, display: DisplayOptions, css?: string) {
  const style = Style({ css });
  const view = View({ result, display });
  document.body.replaceChildren(style, view);
  sendSizeEvents(sendToParent, 'content-size', view);
}

const Style = component(({ css }: { css?: string }) => {
  const style = document.createElement('style');
  style.id = 'iframe-style';
  if (css) {
    style.innerText = css;
  }
  return style;
});
