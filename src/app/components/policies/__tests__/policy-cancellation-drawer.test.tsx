import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import React from 'react';
import PolicyCancellationDrawer from '../policy-cancellation-drawer';

// Mock fetch
global.fetch = jest.fn();

// Mock sweetAlert
jest.mock('sweetalert', () => jest.fn(() => Promise.resolve(true)));

// Mock antd message
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  message: {
    error: jest.fn(),
  },
}));

const mockProps = {
  open: true,
  onClose: jest.fn(),
  policyId: 'test-policy-id',
  policyNumber: 'POL123456',
  memberName: 'John Doe',
};

const renderWithForm = (props = mockProps) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Form>{children}</Form>
  );

  return render(
    <Wrapper>
      <PolicyCancellationDrawer {...props} />
    </Wrapper>
  );
};

describe('PolicyCancellationDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the drawer with correct title', () => {
    renderWithForm();
    expect(screen.getByText('Policy Cancellation Request')).toBeInTheDocument();
  });

  it('displays pre-filled policy information', () => {
    renderWithForm();

    expect(screen.getByDisplayValue('test-policy-id')).toBeInTheDocument();
    expect(screen.getByDisplayValue('POL123456')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
  });

  it('shows form validation errors for required fields', async () => {
    renderWithForm();

    const submitButton = screen.getByText('Submit Request');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please select cancellation type')).toBeInTheDocument();
      expect(screen.getByText('Effective date is required')).toBeInTheDocument();
      expect(screen.getByText('Please provide a reason for cancellation')).toBeInTheDocument();
    });
  });

  it('validates effective date for immediate cancellation', async () => {
    renderWithForm();

    // Set cancellation type to immediate
    const cancellationTypeSelect = screen.getByLabelText('Cancellation Type');
    fireEvent.mouseDown(cancellationTypeSelect);
    fireEvent.click(screen.getByText('Immediate Cancellation'));

    // Set effective date to yesterday
    const effectiveDateInput = screen.getByLabelText('Effective Date');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    fireEvent.change(effectiveDateInput, { target: { value: yesterday.toISOString().split('T')[0] } });

    // Set reason
    const reasonSelect = screen.getByLabelText('Reason for Cancellation');
    fireEvent.mouseDown(reasonSelect);
    fireEvent.click(screen.getByText('Financial Hardship'));

    const submitButton = screen.getByText('Submit Request');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Immediate cancellation effective date must be today or in the future')).toBeInTheDocument();
    });
  });

  it('submits form successfully with valid data', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Success' }),
    });

    renderWithForm();

    // Fill in required fields
    const cancellationTypeSelect = screen.getByLabelText('Cancellation Type');
    fireEvent.mouseDown(cancellationTypeSelect);
    fireEvent.click(screen.getByText('Immediate Cancellation'));

    const effectiveDateInput = screen.getByLabelText('Effective Date');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    fireEvent.change(effectiveDateInput, { target: { value: tomorrow.toISOString().split('T')[0] } });

    const reasonSelect = screen.getByLabelText('Reason for Cancellation');
    fireEvent.mouseDown(reasonSelect);
    fireEvent.click(screen.getByText('Financial Hardship'));

    const submitButton = screen.getByText('Submit Request');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/policies/cancellation-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('test-policy-id'),
      });
    });
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: 'API Error' }),
    });

    renderWithForm();

    // Fill in required fields
    const cancellationTypeSelect = screen.getByLabelText('Cancellation Type');
    fireEvent.mouseDown(cancellationTypeSelect);
    fireEvent.click(screen.getByText('Immediate Cancellation'));

    const effectiveDateInput = screen.getByLabelText('Effective Date');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    fireEvent.change(effectiveDateInput, { target: { value: tomorrow.toISOString().split('T')[0] } });

    const reasonSelect = screen.getByLabelText('Reason for Cancellation');
    fireEvent.mouseDown(reasonSelect);
    fireEvent.click(screen.getByText('Financial Hardship'));

    const submitButton = screen.getByText('Submit Request');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('closes drawer when cancel button is clicked', () => {
    renderWithForm();

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('shows helpful descriptions for form fields', () => {
    renderWithForm();

    expect(screen.getByText('This is the unique identifier for the policy being cancelled.')).toBeInTheDocument();
    expect(screen.getByText('This is the policy number that will be cancelled.')).toBeInTheDocument();
    expect(screen.getByText('This is the name of the policy holder.')).toBeInTheDocument();
    expect(screen.getByText(/Choose when the cancellation should take effect/)).toBeInTheDocument();
    expect(screen.getByText(/Please select the primary reason/)).toBeInTheDocument();
  });
}); 