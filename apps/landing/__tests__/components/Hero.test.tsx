/**
 * Tests for Hero component
 *
 * Example test file demonstrating testing patterns for components
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Hero from '../../components/Hero';

describe('Hero Component', () => {
  it('should render without crashing', () => {
    const { container } = render(
      <Hero />
    );
    expect(container).toBeDefined();
  });

  it('should render hero heading', () => {
    render(<Hero />);
    // Adjust selector based on actual component content
    const elements = screen.queryAllByRole('heading');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('should accept rendering without crashing', () => {
    const { container } = render(
      <Hero />
    );
    expect(container).toBeDefined();
  });
});
