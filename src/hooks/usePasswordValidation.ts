import { useMemo } from "react";
import { z } from "zod";
import { PASSWORD_VALIDATION } from "../config";

const lengthRule = z.string().min(8).max(20);
const uppercaseRule = z.string().regex(/[A-Z]/);

interface PasswordValues {
  password: string;
  confirmPassword?: string;
  oldPassword?: string;
}

const usePasswordValidation = ({ password, confirmPassword, oldPassword }: PasswordValues) =>
  useMemo(() => {
    if (!PASSWORD_VALIDATION) {
      return { validLength: true, validUpperCase: true, passwordsMatch: true, isValid: oldPassword !== undefined ? oldPassword.length > 0 : password.length > 0 };
    }

    const validLength = lengthRule.safeParse(password).success;
    const validUpperCase = uppercaseRule.safeParse(password).success;
    const passwordsMatch = confirmPassword !== undefined ? password === confirmPassword : true;
    const isValid = validLength && validUpperCase && passwordsMatch && (oldPassword !== undefined ? oldPassword.length > 0 : true);

    return { validLength, validUpperCase, passwordsMatch, isValid };
  }, [password, confirmPassword, oldPassword]);

export default usePasswordValidation;
