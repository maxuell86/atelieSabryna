import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './table';

describe('Table', () => {
  it('deve renderizar tabela com cabeçalho e corpo', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Maria</TableCell>
            <TableCell>maria@email.com</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Maria')).toBeInTheDocument();
    expect(screen.getByText('maria@email.com')).toBeInTheDocument();
  });
});
