export type LabelProps = {
  label: string;
  inputName: string;
};

export function Label({ label, inputName }: LabelProps) {
  const labelElement = document.createElement('label');
  labelElement.htmlFor = inputName;
  labelElement.innerText = label;

  return labelElement;
}
