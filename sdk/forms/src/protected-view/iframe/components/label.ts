export type LabelProps = {
  name: string;
};

export function Label({ name }: LabelProps) {
  const labelElement = document.createElement('label');
  labelElement.htmlFor = name;
  labelElement.innerText = name;

  return labelElement;
}
