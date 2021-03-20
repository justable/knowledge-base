import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { Avatar } from '..';

// https://www.robinwieruch.de/react-testing-library
// get会报错，query返回null，find用于异步
describe('Avatar Render', () => {
  const ERROR_URL = 'http://error.url/';
  const SUCCESS_URL =
    'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png';
  let originOffsetWidth;

  beforeAll(() => {
    // Mock offsetHeight
    originOffsetWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetWidth',
    ).get;
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      get() {
        if (this.className === 'avatarString') {
          return 100;
        }
        return 80;
      },
    });
  });

  afterAll(() => {
    // Restore Mock offsetHeight
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      get: originOffsetWidth,
    });
  });

  it('debug', () => {
    render(<Avatar>TestString</Avatar>);
    screen.debug();
  });

  it('Render long string correctly', () => {
    render(<Avatar>TestString</Avatar>);
    expect(screen.getByText('TestString')).toBeInTheDocument();
    expect(screen.queryByText('TestString')).toHaveClass('avatarString');
  });

  it('should render fallback string correctly', async () => {
    render(<Avatar src={ERROR_URL}>Fallback</Avatar>);
    expect(screen.getByRole('img')).toHaveProperty('src', ERROR_URL);
    fireEvent.error(screen.getByRole('img'));
    expect(await screen.findByText('Fallback')).toBeInTheDocument();
  });

  it('should handle onError correctly', async () => {
    let onError;
    function Wrapper() {
      const [url, setUrl] = useState(ERROR_URL);
      onError = jest.fn(() => setUrl(SUCCESS_URL));
      return (
        <Avatar src={url} onError={onError}>
          Fallback
        </Avatar>
      );
    }
    render(<Wrapper></Wrapper>);
    expect(screen.getByRole('img')).toHaveProperty('src', ERROR_URL);
    fireEvent.error(screen.getByRole('img'));
    expect(await screen.findByRole('img')).toHaveProperty('src', SUCCESS_URL);
  });

  it('should calculate scale of avatar children correctly', () => {
    render(<Avatar>Long String</Avatar>);
    expect(screen.getByText(/Long/)).toHaveStyle({
      transform: 'scale(0.72) translateX(-50%)',
    });
  });

  it('should calculate scale of avatar children correctly with gap', () => {
    render(<Avatar gap={2}>Long String</Avatar>);
    expect(screen.getByText(/Long/)).toHaveStyle({
      transform: 'scale(0.76) translateX(-50%)',
    });
    render(<Avatar gap={200}>TestString</Avatar>);
    expect(screen.getByText('TestString')).toHaveStyle({
      transform: 'scale(1) translateX(-50%)',
    });
  });

  it('support size is number', () => {
    render(<Avatar size={60}>TestString</Avatar>);
    screen.debug();
    expect(screen.getByText('TestString').parentNode).toHaveStyle({
      width: '60px',
      height: '60px',
    });
  });
});
