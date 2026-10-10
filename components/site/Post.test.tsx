import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { areas } from '@/components/home/areas';
import { Post } from './Post';

test('a post’s page: the way back, the title, the date, the area, the picture, the full text, the sign-up link', () => {
  render(
    <Post
      back={{ href: '/arrangementer', label: 'Arrangementer' }}
      title="Åpen kveld"
      meta={<time dateTime="2027-01-20">20. januar 2027</time>}
      area="dialog"
      image={{ src: '/opplastet/arrangementer/a/src.jpg', alt: 'Et rom' }}
      action={{ href: 'https://example.org/pamelding', label: 'Påmelding eller mer informasjon' }}
      body={'## Program\n\nFørst en samtale.'}
    />,
  );
  expect(screen.getByRole('link', { name: 'Arrangementer' })).toHaveAttribute('href', '/arrangementer');
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Åpen kveld');
  expect(screen.getByText('20. januar 2027')).toHaveAttribute('datetime', '2027-01-20');
  expect(screen.getByText(areas.find((a) => a.key === 'dialog')!.name)).toBeInTheDocument();
  // The lead picture sits under the title, likely the largest thing on the first screen: eager, high priority.
  const lead = screen.getByRole('img', { name: 'Et rom' });
  expect(lead).toHaveAttribute('loading', 'eager');
  expect(lead).toHaveAttribute('fetchpriority', 'high');
  expect(screen.getByRole('heading', { level: 2, name: 'Program' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Påmelding eller mer informasjon' })).toHaveAttribute('href', 'https://example.org/pamelding');
});

test('without an area, a picture or a link, the page has none of them', () => {
  const { container } = render(
    <Post back={{ href: '/arrangementer#nyheter', label: 'Arrangementer' }} title="En nyhet" meta="1. mars 2027" area={null} image={null} body="Tekst." />,
  );
  expect(container.querySelector('img')).toBeNull();
  expect(screen.getAllByRole('link')).toHaveLength(1); // the way back only
});
