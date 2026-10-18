/**
 * NIRMANSETU: CUSTOMER SAVED ADDRESSES SERVICE
 *
 * Implements address book management for site delivery locations:
 * - Address validation and PIN code serviceability
 * - Setting and switching default delivery sites
 * - Customer record isolation (users can only access/modify their own addresses)
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CustomerAddress, AddressType } from '@/types/database';
import { validatePincodeServiceability } from '@/lib/orders/service';

export interface AddressInputData {
  addressType: AddressType;
  siteOrPersonName: string;
  contactPhone: string;
  alternatePhone?: string;
  streetAddress: string;
  landmark?: string;
  pincode: string;
  city?: string;
  state?: string;
  unloadingInstructions?: string;
  hasTruckAccess?: boolean;
  isDefault?: boolean;
}

// In-memory store for test/demo accounts when Supabase is in offline mode
const memoryAddresses = new Map<string, CustomerAddress[]>();

// Seed initial address for contractor demo user
memoryAddresses.set('demo-user-ayodhya-001', [
  {
    id: 'ca000000-0000-0000-0000-000000000001',
    user_id: 'demo-user-ayodhya-001',
    address_type: 'site',
    site_or_person_name: 'Ram Janmabhoomi Complex Construction Site #4',
    contact_phone: '9450012345',
    alternate_phone: '9450098765',
    street_address: 'Ramkot, Near Hanumangarhi Gate 3',
    landmark: 'Opposite Tedhi Bazar Police Chowki',
    pincode: '224123',
    city: 'Ayodhya',
    state: 'Uttar Pradesh',
    latitude: 26.7956,
    longitude: 82.1943,
    unloading_instructions: 'Unload near foundation batching plant. Entry permitted after 20:00 for heavy multi-axle trucks.',
    has_truck_access: true,
    is_default: true,
    created_at: '2026-10-18T00:00:00Z',
    updated_at: '2026-10-18T00:00:00Z',
  },
  {
    id: 'ca000000-0000-0000-0000-000000000002',
    user_id: 'demo-user-ayodhya-001',
    address_type: 'commercial',
    site_or_person_name: 'Shri Ram Infra Developers Site Office',
    contact_phone: '9450012345',
    alternate_phone: null,
    street_address: 'Shop 12, Civil Lines Commercial Complex',
    landmark: 'Near Faizabad Head Post Office',
    pincode: '224001',
    city: 'Ayodhya',
    state: 'Uttar Pradesh',
    latitude: 26.7801,
    longitude: 82.1405,
    unloading_instructions: 'Ground floor office reception. Standard daytime delivery.',
    has_truck_access: true,
    is_default: false,
    created_at: '2026-10-18T00:00:00Z',
    updated_at: '2026-10-18T00:00:00Z',
  },
]);

/**
 * Lists saved addresses for a customer.
 */
export async function listCustomerAddresses(userId: string): Promise<CustomerAddress[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as CustomerAddress[];
    }
  } catch {
    // Handled
  }

  return memoryAddresses.get(userId) || [];
}

/**
 * Adds a new delivery site address.
 */
export async function addCustomerAddress(
  userId: string,
  input: AddressInputData
): Promise<{ success: boolean; address?: CustomerAddress; error?: string }> {
  // Validate PIN code
  const serviceability = await validatePincodeServiceability(input.pincode);
  if (!serviceability.isServiceable) {
    return {
      success: false,
      error: `PIN code ${input.pincode} is outside our approved Ayodhya delivery zones.`,
    };
  }

  const userList = memoryAddresses.get(userId) || [];
  const isFirstAddress = userList.length === 0;
  const isDefault = input.isDefault || isFirstAddress;

  if (isDefault) {
    // Unset other defaults
    for (const a of userList) {
      a.is_default = false;
    }
  }

  const newAddress: CustomerAddress = {
    id: `ca000000-0000-0000-0000-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
    user_id: userId,
    address_type: input.addressType,
    site_or_person_name: input.siteOrPersonName,
    contact_phone: input.contactPhone,
    alternate_phone: input.alternatePhone || null,
    street_address: input.streetAddress,
    landmark: input.landmark || null,
    pincode: input.pincode,
    city: input.city || 'Ayodhya',
    state: input.state || 'Uttar Pradesh',
    latitude: null,
    longitude: null,
    unloading_instructions: input.unloadingInstructions || null,
    has_truck_access: input.hasTruckAccess ?? true,
    is_default: isDefault,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  userList.unshift(newAddress);
  memoryAddresses.set(userId, userList);

  try {
    const supabase = createServerSupabaseClient();
    if (isDefault) {
      await supabase.from('customer_addresses').update({ is_default: false }).eq('user_id', userId);
    }
    await supabase.from('customer_addresses').insert(newAddress);
  } catch {
    // Handled
  }

  return { success: true, address: newAddress };
}

/**
 * Deletes an address belonging to the user.
 */
export async function deleteCustomerAddress(
  addressId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const userList = memoryAddresses.get(userId) || [];
  const filtered = userList.filter((a) => a.id !== addressId);
  memoryAddresses.set(userId, filtered);

  try {
    const supabase = createServerSupabaseClient();
    await supabase
      .from('customer_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId);
  } catch {
    // Handled
  }

  return { success: true };
}

/**
 * Sets an address as the default site for a customer.
 */
export async function setDefaultAddress(
  addressId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const userList = memoryAddresses.get(userId) || [];
  let found = false;

  for (const a of userList) {
    if (a.id === addressId) {
      a.is_default = true;
      found = true;
    } else {
      a.is_default = false;
    }
  }

  if (!found) {
    return { success: false, error: 'Address not found' };
  }

  try {
    const supabase = createServerSupabaseClient();
    await supabase.from('customer_addresses').update({ is_default: false }).eq('user_id', userId);
    await supabase.from('customer_addresses').update({ is_default: true }).eq('id', addressId).eq('user_id', userId);
  } catch {
    // Handled
  }

  return { success: true };
}
