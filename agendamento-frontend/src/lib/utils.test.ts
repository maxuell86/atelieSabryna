import { cn } from './utils';

describe('cn', () => {
  it('deve concatenar classes simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('deve filtrar valores falsy', () => {
    expect(cn('foo', false, null, undefined, 0, 'bar')).toBe('foo bar');
  });

  it('deve mergear classes do Tailwind corretamente', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('deve aceitar arrays de classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });

  it('deve aceitar objetos condicionais', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo');
  });
});
