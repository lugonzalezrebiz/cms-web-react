import { useMemo } from "react";
import { z } from "zod";
import { PASSWORD_VALIDATION } from "../config";

const lengthRule = z.string().min(8).max(20);
const uppercaseRule = z.string().regex(/[A-Z]/);

interface PasswordValues {
  password: string;
  confirmPassword?: string;
}

const usePasswordValidation = ({ password, confirmPassword }: PasswordValues) =>
  useMemo(() => {
    if (!PASSWORD_VALIDATION) {
      return { validLength: true, validUpperCase: true, passwordsMatch: true, isValid: password.length > 0 };
    }

    const validLength = lengthRule.safeParse(password).success;
    const validUpperCase = uppercaseRule.safeParse(password).success;
    const passwordsMatch = confirmPassword !== undefined ? password === confirmPassword : true;
    const isValid = validLength && validUpperCase && passwordsMatch;

    return { validLength, validUpperCase, passwordsMatch, isValid };
  }, [password, confirmPassword]);

export default usePasswordValidation;
