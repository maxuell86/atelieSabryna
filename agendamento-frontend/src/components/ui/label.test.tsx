import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Label } from './label';

describe('Label', () => {
  it('deve renderizar com texto', () => {
    render(<Label>Nome</Label>);
    expect(screen.getByText('Nome')).toBeInTheDocument();
  });

  it('deve associar ao input pelo htmlFor', () => {
    render(
      <>
        <Label htmlFor="nome">Nome</Label>
        <input id="nome" />
      </>,
    );
    const label = screen.getByText('Nome');
    expect(label).toHaveAttribute('for', 'nome');
  });
});
