import { ref, type Ref } from 'vue';
import {
  getRequestErrorDetails,
  getRequestErrorMessage,
} from '@/api/ApiClient';

interface Refusal {
  message: string;
  value: string;
}

/**
 * What the server refused in a form. A field's refusal shows only while the
 * field still holds the value that was refused, so changing a taken login
 * clears its message and changing it back brings the message back. A failure
 * that names no field goes to `formError`.
 *
 * `fields` lists the form's fields in their order on screen.
 */
export function useRefusedFields<Field extends string>(
  fields: Record<Field, Ref<string>>,
) {
  const refusals = ref({}) as Ref<Partial<Record<Field, Refusal>>>;
  const formError = ref('');

  const fieldNames = Object.keys(fields) as Field[];

  function isField(path: string): path is Field {
    return (fieldNames as string[]).includes(path);
  }

  function refusalOf(field: Field) {
    const refusal = refusals.value[field];

    return refusal?.value === fields[field].value ? refusal.message : '';
  }

  function refuseField(field: Field, message: string) {
    refusals.value = {
      ...refusals.value,
      [field]: { message, value: fields[field].value },
    };
  }

  /** Puts each field the error names under that field, or the error's message
   * in `formError` when it names none. Returns the first field refused. */
  function refuse(error: unknown, fallbackMessage: string) {
    const details = getRequestErrorDetails(error);
    let isAnyFieldRefused = false;

    for (const { path, message } of details) {
      if (isField(path)) {
        refuseField(path, message);
        isAnyFieldRefused = true;
      }
    }

    if (!isAnyFieldRefused) {
      formError.value = getRequestErrorMessage(error) ?? fallbackMessage;

      return undefined;
    }

    return fieldNames.find((field) => refusals.value[field]);
  }

  function reset() {
    refusals.value = {};
    formError.value = '';
  }

  return { formError, refusalOf, refuseField, refuse, reset };
}
