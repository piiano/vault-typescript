import { sendSizeEvents } from '../../common/size';
import { ObjectFields } from '@piiano/vault-client';
import type { Sender } from '../../common/events';
import { View } from './view';
import { component } from '../../common/component';

export function renderView(sendToParent: Sender, objects: Array<ObjectFields>, css?: string) {
  const style = Style({ css });
  const view = View({ objects });
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
