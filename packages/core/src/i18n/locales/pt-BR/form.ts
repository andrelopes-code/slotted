import type { FormMessages } from '../../messages/form';

export const ptBR: FormMessages = {
  summaryTitle: 'Há um problema',
  errors: {
    required: 'Preencha este campo.',
    email: 'Informe um endereço de e-mail.',
    min: 'Informe um valor igual ou maior que {min}.',
    max: 'Informe um valor igual ou menor que {max}.',
    minlength: 'Use pelo menos {length, plural, one {# caractere} other {# caracteres}}.',
    maxlength: 'Use no máximo {length, plural, one {# caractere} other {# caracteres}}.',
    pattern: 'Siga o formato solicitado.',
  },
};
