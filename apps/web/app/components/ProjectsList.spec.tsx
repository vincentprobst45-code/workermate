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
    window.history.replaceState({}, '', '/projects');
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
    fireEvent.click(screen.getAllByRole('button', { name: 'Ouvrir le projet PRJ-2026-001' })[0]);

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

    fireEvent.click(screen.getAllByRole('button', { name: 'Ouvrir le projet PRJ-2026-001' })[0]);

    expect(handleSelected).toHaveBeenCalledWith(mockProject);
    expect(window.location.search).toBe('?project=proj-1');
  });

  it('filters projects by reference, title, and customer and distinguishes an empty result', () => {
    render(
      <AuthProvider session={session}>
        <ProjectsList projects={[mockProject]} onDelete={null} />
      </AuthProvider>,
    );

    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher un projet' }), { target: { value: 'inexistant' } });

    expect(screen.getByText('Aucun résultat')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réinitialiser les filtres' })).toBeInTheDocument();
  });

  it('shows the primary customer and the number of other customers', () => {
    const project = {
      ...mockProject,
      customers: [
        mockProject.customers[0],
        { customerId: 'cust-2', isPrimary: false, customer: { id: 'cust-2', firstName: 'Marie', lastName: 'Martin' } },
        { customerId: 'cust-3', isPrimary: false, customer: { id: 'cust-3', firstName: 'Paul', lastName: 'Durand' } },
      ],
    };

    render(
      <AuthProvider session={session}>
        <ProjectsList projects={[project]} onDelete={null} />
      </AuthProvider>,
    );

    expect(screen.getAllByText('Jean Dupont Dupont SARL +2 autres').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Marie Martin/)).toBeNull();
  });

  it('opens a custom confirmation before deleting a project', () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(
      <AuthProvider session={session}>
        <ProjectsList projects={[mockProject]} onDelete={onDelete} />
      </AuthProvider>,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Supprimer le projet PRJ-2026-001' })[0]);
    expect(screen.getByRole('dialog', { name: 'Supprimer ce projet ?' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer', exact: true }));
    expect(onDelete).toHaveBeenCalledWith('proj-1');
  });
});
