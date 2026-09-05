import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectsList from './ProjectsList';
import type { Project } from './AddProjectForm';
import { AuthProvider } from '../auth.context';
import type { Session } from '../lib/auth.types';

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const session: Session = {
  user: { id: 'user-1', email: 'user@example.com', firstname: 'Jane', lastname: 'Doe' },
  tenants: [{ tenantId: 'tenant-1', tenantName: 'Acme', role: 'MEMBER' }],
  activeTenant: { tenantId: 'tenant-1', tenantName: 'Acme', role: 'MEMBER' },
};

const mockProject: Project = {
  id: 'proj-1',
  tenantId: 'tenant-1',
  reference: 'PRJ-2026-001',
  title: 'Rénovation Cuisine',
  description: 'Projet de rénovation complète',
  status: 'OPEN',
  customers: [
    {
      customerId: 'cust-1',
      isPrimary: true,
      customer: {
        id: 'cust-1',
        firstName: 'Jean',
        lastName: 'Dupont',
        company: 'Dupont SARL',
      },
    },
  ],
  _count: {
    quotes: 1,
    workOrders: 2,
    invoices: 0,
    calendarEvents: 0,
  },
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
};

describe('ProjectsList', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        customers: [],
        workOrders: [],
        quotes: [],
        invoices: [],
      }),
    });
  });

  it('renders list of projects and shows details on page with breadcrumb and retour button when clicked', () => {
    render(
      <AuthProvider session={session}>
        <ProjectsList projects={[mockProject]} onDelete={null} />
      </AuthProvider>,
    );

    // Initial state: project reference is in the list
    expect(screen.getAllByText('PRJ-2026-001').length).toBeGreaterThan(0);

    // Click on the project row
    const projectRow = screen.getAllByText('Rénovation Cuisine')[0];
    fireEvent.click(projectRow);

    // Breadcrumb should be present with aria-label "Fil d'ariane"
    const breadcrumb = screen.getByRole('navigation', { name: "Fil d'ariane" });
    expect(breadcrumb).toBeInTheDocument();
    expect(breadcrumb).toHaveTextContent('Accueil');
    expect(breadcrumb).toHaveTextContent('Projets');
    expect(breadcrumb).toHaveTextContent('PRJ-2026-001 — Rénovation Cuisine');

    // "Retour" button should be present
    const backButton = screen.getByRole('button', { name: 'Retour' });
    expect(backButton).toBeInTheDocument();

    // No modal backdrop (bg-black/40) should exist
    expect(document.querySelector('.bg-black\\/40')).toBeNull();

    // Clicking "Retour" should return to the projects list
    fireEvent.click(backButton);
    expect(screen.queryByRole('navigation', { name: "Fil d'ariane" })).toBeNull();
  });

  it('calls handleSelectedProject when provided', () => {
    const handleSelected = vi.fn();
    render(
      <AuthProvider session={session}>
        <ProjectsList
          projects={[mockProject]}
          onDelete={null}
          handleSelectedProject={handleSelected}
        />
      </AuthProvider>,
    );

    const projectRow = screen.getAllByText('Rénovation Cuisine')[0];
    fireEvent.click(projectRow);

    expect(handleSelected).toHaveBeenCalledWith(mockProject);
  });
});
