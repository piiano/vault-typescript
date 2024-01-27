export type SubmitButtonProps = {
  submitButton: string;
};

export function SubmitButton({ submitButton }: SubmitButtonProps) {
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.innerText = submitButton;

  return submit;
}
