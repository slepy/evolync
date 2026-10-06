import { TextField, type ListAccent } from "@/core/components";
import React from "react";
import { Controller, type Control, type FieldErrors, type FieldValues, type Path } from "react-hook-form";
import { passwordRuleStates } from "../utils/passwordRules";
import { PasswordRules } from "./PasswordRules";

interface PasswordFieldsProps<T extends FieldValues> {
  control: Control<T>;
  errors: FieldErrors<T>;
  /** Field names of the password and its confirmation. */
  password: Path<T>;
  confirm: Path<T>;
  passwordLabel: string;
  confirmLabel: string;
  accent?: ListAccent;
  disabled?: boolean;
}

/**
 * PASSWORD with the rule chips under it, then CONFIRM PASSWORD (sign up and
 * new password boards). The chips explain a weak password, so its error text
 * shows only once every chip is green (a character outside the allowed set).
 */
export function PasswordFields<T extends FieldValues>({
  control,
  errors,
  password,
  confirm,
  passwordLabel,
  confirmLabel,
  accent,
  disabled,
}: PasswordFieldsProps<T>) {
  return (
    <>
      <Controller
        control={control}
        name={password}
        render={({ field }) => {
          const value = (field.value as string) ?? "";
          const allMet = passwordRuleStates(value).every((r) => r.met);
          return (
            <TextField
              size="large"
              secure
              accent={accent}
              label={passwordLabel}
              value={value}
              onChangeText={field.onChange}
              placeholder="••••••••"
              disabled={disabled}
              autoComplete="new-password"
              textContentType="newPassword"
              error={allMet ? (errors[password]?.message as string | undefined) : undefined}
              footer={<PasswordRules password={value} />}
            />
          );
        }}
      />
      <Controller
        control={control}
        name={confirm}
        render={({ field }) => (
          <TextField
            size="large"
            secure
            accent={accent}
            label={confirmLabel}
            value={(field.value as string) ?? ""}
            onChangeText={field.onChange}
            placeholder="••••••••"
            disabled={disabled}
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors[confirm]?.message as string | undefined}
          />
        )}
      />
    </>
  );
}
