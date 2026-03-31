/**
 * Tests for Hero component
 *
 * Example test file demonstrating testing patterns for components
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Hero from '../../components/Hero';

describe('Hero Component', () => {
  it('should render without crashing', () => {
    const { container } = render(
      <Hero stats={[]} />
    );
    expect(container).toBeDefined();
  });

  it('should render hero heading', () => {
    render(<Hero stats={[]} />);
    // Adjust selector based on actual component content
    const elements = screen.queryAllByRole('heading');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('should accept stats prop', () => {
    const mockStats = [
      { label: 'Farmers', value: '1000+' },
      { label: 'Hectares', value: '5000+' },
    ];
    const { container } = render(
      <Hero stats={mockStats} />
    );
    expect(container).toBeDefined();
  });
});
