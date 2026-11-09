/**
 * Client-side validation for Vote Social authentication and waitlist profile forms.
 */

export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(email: string): string | undefined {
  const value = email.trim();
  if (!value) {
    return "Email is required.";
  }
  if (!EMAIL_PATTERN.test(value)) {
    return "Enter a valid email address.";
  }
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) {
    return "Password is required.";
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return undefined;
}

export function validateDisplayName(name: string): string | undefined {
  const value = name.trim();
  if (!value) {
    return "Name is required.";
  }
  if (value.length < 2) {
    return "Name must be at least 2 characters.";
  }
  return undefined;
}

export function validateFirstName(name: string): string | undefined {
  const value = name.trim();
  if (!value) {
    return "First name is required.";
  }
  if (value.length < 2) {
    return "First name must be at least 2 characters.";
  }
  return undefined;
}

export function validateLastName(name: string): string | undefined {
  const value = name.trim();
  if (!value) {
    return "Last name is required.";
  }
  if (value.length < 2) {
    return "Last name must be at least 2 characters.";
  }
  return undefined;
}

export function validatePostcode(postcode: string): string | undefined {
  const value = postcode.trim();
  if (!value) {
    return "Postal code is required.";
  }
  if (value.length < 3) {
    return "Enter a valid postal code (e.g. M4K 1N2).";
  }
  return undefined;
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string,
): string | undefined {
  if (!confirmPassword) {
    return "Please confirm your password.";
  }
  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }
  return undefined;
}

export interface RegisterInput {
  email: string;
  password: string;
  confirmPassword: string;
}

export function validateRegisterForm(input: RegisterInput): FieldErrors {
  const errors: FieldErrors = {
    email: validateEmail(input.email),
    password: validatePassword(input.password),
    confirmPassword: validateConfirmPassword(input.password, input.confirmPassword),
  };
  return pruneEmpty(errors);
}

export interface LoginInput {
  email: string;
  password: string;
}

export function validateLoginForm(input: LoginInput): FieldErrors {
  const errors: FieldErrors = {
    email: validateEmail(input.email),
    password: input.password ? undefined : "Password is required.",
  };
  return pruneEmpty(errors);
}

export interface VoteSocialProfileInput {
  first_name: string;
  last_name: string;
  postcode: string;
  is_candidate: boolean;
  candidate_election: string;
  is_org_representative: boolean;
  organization_name: string;
  is_journalist: boolean;
  published_article_url: string;
}

export function validateVoteSocialProfileForm(input: VoteSocialProfileInput): FieldErrors {
  const errors: FieldErrors = {
    first_name: validateFirstName(input.first_name),
    last_name: validateLastName(input.last_name),
    postcode: validatePostcode(input.postcode),
    candidate_election:
      input.is_candidate && !input.candidate_election.trim()
        ? "Please specify which election or riding you are running in."
        : undefined,
    organization_name:
      input.is_org_representative && !input.organization_name.trim()
        ? "Please enter your organization's name."
        : undefined,
    published_article_url:
      input.is_journalist && !input.published_article_url.trim()
        ? "Please provide a link to a published article."
        : undefined,
  };
  return pruneEmpty(errors);
}

export function validateCommunity(
  community: string,
  isCanonicalCommunity: (id: string) => boolean,
): string | undefined {
  const value = community.trim();
  if (!value) {
    return "Please choose your community.";
  }
  if (!isCanonicalCommunity(value)) {
    return "Please choose a community from the list.";
  }
  return undefined;
}

export function isValid(errors: FieldErrors): boolean {
  return Object.keys(errors).length === 0;
}

function pruneEmpty(errors: FieldErrors): FieldErrors {
  return Object.fromEntries(
    Object.entries(errors).filter(([, value]) => value !== undefined),
  ) as FieldErrors;
}
