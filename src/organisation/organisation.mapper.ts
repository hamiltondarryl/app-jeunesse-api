const SENSITIVE_ORG_FIELDS = [
  'rib',
  'recepice',
  'recepiceProvisoirOuDefinitif',
] as const;

const SENSITIVE_PERSON_FIELDS = ['pieceIdentite'] as const;

function omitFields<T extends Record<string, unknown>>(
  data: T,
  fields: readonly string[],
): T {
  const clone = { ...data };
  for (const field of fields) {
    delete clone[field];
  }
  return clone;
}

function sanitizePerson(person: Record<string, unknown> | null | undefined) {
  if (!person) {
    return null;
  }
  return omitFields(person, SENSITIVE_PERSON_FIELDS);
}

export function toPublicOrganisation(organisation: any) {
  if (!organisation) {
    return organisation;
  }

  return {
    ...omitFields(organisation, SENSITIVE_ORG_FIELDS),
    responsable: sanitizePerson(organisation.responsable),
    secretaireGeneral: undefined,
    tresorier: undefined,
  };
}

export function toPublicOrganisationList(organisations: any[]) {
  return organisations.map((organisation) => toPublicOrganisation(organisation));
}

export function toSafeAdminOrganisation(organisation: any) {
  if (!organisation) {
    return organisation;
  }

  return {
    ...organisation,
    responsable: organisation.responsable ?? null,
    secretaireGeneral: organisation.secretaireGeneral ?? null,
    tresorier: organisation.tresorier ?? null,
  };
}
