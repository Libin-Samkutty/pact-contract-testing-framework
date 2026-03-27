// consumer/src/types/user.types.ts

/**
 * =============================================================================
 * USER TYPES
 * =============================================================================
 * Type definitions for DummyJSON user endpoints.
 *
 * @see https://dummyjson.com/docs/users
 * =============================================================================
 */

/**
 * User's hair details
 */
export interface UserHair {
  color: string;
  type: string;
}

/**
 * User's address with coordinates
 */
export interface UserAddress {
  address: string;
  city: string;
  state: string;
  stateCode: string;
  postalCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  country: string;
}

/**
 * User's bank details
 */
export interface UserBank {
  cardExpire: string;
  cardNumber: string;
  cardType: string;
  currency: string;
  iban: string;
}

/**
 * User's company information
 */
export interface UserCompany {
  department: string;
  name: string;
  title: string;
  address: UserAddress;
}

/**
 * User's cryptocurrency wallet
 */
export interface UserCrypto {
  coin: string;
  wallet: string;
  network: string;
}

/**
 * Single user entity
 */
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  maidenName: string;
  age: number;
  gender: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  birthDate: string;
  image: string;
  bloodGroup: string;
  height: number;
  weight: number;
  eyeColor: string;
  hair: UserHair;
  ip: string;
  address: UserAddress;
  macAddress: string;
  university: string;
  bank: UserBank;
  company: UserCompany;
  ein: string;
  ssn: string;
  userAgent: string;
  crypto: UserCrypto;
  role: string;
}

/**
 * Simplified user for list views
 */
export interface UserSummary {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  image: string;
}

/**
 * Paginated user list response
 */
export interface UserListResponse {
  users: User[];
  total: number;
  skip: number;
  limit: number;
}

/**
 * Error response from user endpoints
 */
export interface UserErrorResponse {
  message: string;
}
