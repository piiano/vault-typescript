import { sendSizeEvents } from '../../common/size';
import { ObjectFields } from '@piiano/vault-client';
import type { Sender } from '../../common/events';
import type { Style } from '../../common/models';
import { View } from './view';

export function renderView(sendToParent: Sender, style: Style, objects: Array<ObjectFields>) {
  applyStyle(style);
  const view = View({ objects });
  document.body.appendChild(view);
  sendSizeEvents(sendToParent, 'content-size', view);
  return view;
}

function applyStyle({ theme, css, variables }: Style = {}) {
  if (css) {
    const style = document.createElement('style');
    style.id = 'iframe-style';
    style.innerText = css;
    document.body.prepend(style);
  }
  if (theme) {
    document.body.classList.add(theme);
  }
  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });
  }
}

function removeStyle({ theme, css, variables }: Style = {}) {
  if (css) {
    document.getElementById('iframe-style')?.remove();
  }
  if (theme) {
    document.body.classList.remove(theme);
  }
  if (variables) {
    Object.entries(variables).forEach(([key, value]) => {
      document.documentElement.style.removeProperty(`--${key}`);
    });
  }
}
