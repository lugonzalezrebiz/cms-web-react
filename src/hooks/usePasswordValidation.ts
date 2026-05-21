import { useMemo } from "react";
import { z } from "zod";
import { PASSWORD_VALIDATION } from "../config";

const lengthRule = z.string().min(8).max(20);
const uppercaseRule = z.string().regex(/[A-Z]/);

interface PasswordValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const usePasswordValidation = ({ oldPassword, newPassword, confirmPassword }: PasswordValues) =>
  useMemo(() => {
    if (!PASSWORD_VALIDATION) {
      return { validLength: true, validUpperCase: true, passwordsMatch: true, isValid: oldPassword.length > 0 };
    }

    const validLength = lengthRule.safeParse(newPassword).success;
    const validUpperCase = uppercaseRule.safeParse(newPassword).success;
    const passwordsMatch = newPassword === confirmPassword;
    const isValid = validLength && validUpperCase && passwordsMatch && oldPassword.length > 0;

    return { validLength, validUpperCase, passwordsMatch, isValid };
  }, [oldPassword, newPassword, confirmPassword]);

export default usePasswordValidation;
