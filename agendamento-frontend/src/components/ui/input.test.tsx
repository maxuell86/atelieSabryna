import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

describe('Input', () => {
  it('deve renderizar com placeholder', () => {
    render(<Input placeholder="Digite seu nome" />);
    expect(screen.getByPlaceholderText('Digite seu nome')).toBeInTheDocument();
  });

  it('deve aceitar digitação', async () => {
    render(<Input aria-label="Nome" />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Maria');
    expect(input).toHaveValue('Maria');
  });

  it('deve estar desabilitado quando disabled', () => {
    render(<Input disabled aria-label="Desabilitado" />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
